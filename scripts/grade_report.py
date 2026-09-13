#!/usr/bin/env python3
"""
BD Buddy — Grade Report PDF Generator
Reads JSON from stdin, writes A4 PDF to stdout.

Produces 3 pages:
  Page 1 — Cover Page & Student Profile
  Page 2 — Semester Grade Report
  Page 3 — Official Grading Key & Trust Disclaimer
"""

import sys
import os
import json
import io
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas as pdfcanvas

# Keep real stdout for PDF bytes; send anything else to stderr
_real_stdout = sys.stdout
sys.stdout = sys.stderr

# Add this script's directory to path so we can import siblings
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from page1 import draw_page_one
from page2 import draw_page_two
from page3 import draw_page_three


def generate_pdf(data):
    """Build the PDF and return bytes."""

    bio = data.get("biography", {}) or {}
    student_id = bio.get("studentId", "")

    # Validate: require at least a student ID
    if not student_id or student_id == "UNKNOWN":
        raise ValueError("No student data provided")

    if not bio.get("fullName"):
        raise ValueError("No student name provided")

    serial = data.get("serial") or f"BDU-GR-{student_id}-X4K9L"
    verify_url = data.get("verifyUrl") or \
                 f"https://bdu-portal.onrender.com/verify/BDU-{student_id}"

    print_date = datetime.now().strftime("%b %d, %Y")

    buf = io.BytesIO()
    c = pdfcanvas.Canvas(buf, pagesize=A4)
    c.setTitle("BDU Grade Report — BD Buddy")
    c.setAuthor("BD Buddy")

    draw_page_one(c, data, serial, print_date, verify_url)

    # ---------- Multi-semester handling ----------
    registrations = data.get("registrations") or []
    courses_by_sem = data.get("coursesBySemester") or {}

    if not registrations:
        # Backward compat: single-semester payload
        legacy_reg = data.get("registration") or {}
        legacy_courses = data.get("courses") or []
        if legacy_reg:
            registrations = [legacy_reg]
            courses_by_sem = {str(legacy_reg.get("semester", "I")): legacy_courses}

    # Filter to semesters that actually have courses
    populated = []
    for reg in registrations:
        sem_id = str(reg.get("semester", "I"))
        sem_courses = courses_by_sem.get(sem_id) or []
        if sem_courses:
            populated.append((reg, sem_id, sem_courses))

    if not populated:
        # Nothing to render — fall back to a single page so the doc isn't blank
        draw_page_two(c, data, serial, print_date, verify_url)
    else:
        # Summary table appears inline on the cover page (page1.py).

        # Group populated semesters by academic year.
        # Within a year with both Sem I and Sem II, use Cumulative mode
        # (two-column). A year with only one semester uses single-column.
        from collections import OrderedDict
        by_year = OrderedDict()
        for reg, sem_id, sem_courses in populated:
            year = str(reg.get("acYear") or "Unknown")
            by_year.setdefault(year, {})[sem_id] = (reg, sem_courses)

        for year, sems in by_year.items():
            sem_ids = sorted(sems.keys())

            if "I" in sems and "II" in sems:
                # Cumulative: both semesters side by side
                reg_i, courses_i = sems["I"]
                reg_ii, courses_ii = sems["II"]
                all_courses = courses_i + courses_ii
                total_credits = sum(float(x.get("credit", 0) or 0) for x in all_courses)

                page_data = {
                    "biography": data.get("biography", {}),
                    "registration": {
                        "program": reg_ii.get("program") or data.get("program") or "—",
                        "acYear": year,
                        "semester": "Cumulative",
                        "status": reg_ii.get("status", "Pass"),
                    },
                    "courses": all_courses,
                    "summary": {
                        "totalCredits": total_credits,
                        "cumulativeGPA": reg_ii.get("cgpa", "—"),
                        "sgpa": reg_ii.get("sgpa", "—"),
                    },
                    "printMode": "Cumulative",
                }
            else:
                # Only one semester in this year — single-column
                sem_id = sem_ids[0]
                reg, sem_courses = sems[sem_id]
                total_credits = sum(float(x.get("credit", 0) or 0) for x in sem_courses)

                page_data = {
                    "biography": data.get("biography", {}),
                    "registration": {
                        "program": reg.get("program") or data.get("program") or "—",
                        "acYear": year,
                        "semester": sem_id,
                        "status": reg.get("status", "Pass"),
                    },
                    "courses": sem_courses,
                    "summary": {
                        "totalCredits": total_credits,
                        "cumulativeGPA": reg.get("cgpa", "—"),
                        "sgpa": reg.get("sgpa", "—"),
                    },
                    "printMode": "Semester " + sem_id,
                }

            draw_page_two(c, page_data, serial, print_date, verify_url)

    draw_page_three(c, data, serial, print_date, verify_url)

    return buf.getvalue()


def main():
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            sys.stderr.write("No stdin JSON received.\n")
            sys.exit(1)

        data = json.loads(raw)
        pdf_bytes = generate_pdf(data)

        _real_stdout.buffer.write(pdf_bytes)
        _real_stdout.buffer.flush()
    except Exception as e:
        sys.stderr.write(f"Grade PDF compilation error: {e}\n")
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
