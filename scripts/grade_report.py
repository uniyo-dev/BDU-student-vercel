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
    student_id = bio.get("studentId", "UNKNOWN")

    serial = data.get("serial") or f"BDU-GR-{student_id}-X4K9L"
    verify_url = data.get("verifyUrl") or \
                 f"https://bdu-portal.onrender.com/verify/BDU-{student_id}"

    print_date = datetime.now().strftime("%b %d, %Y")

    buf = io.BytesIO()
    c = pdfcanvas.Canvas(buf, pagesize=A4)
    c.setTitle("BDU Grade Report — BD Buddy")
    c.setAuthor("BD Buddy")

    draw_page_one(c, data, serial, print_date, verify_url)
    draw_page_two(c, data, serial, print_date, verify_url)
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
