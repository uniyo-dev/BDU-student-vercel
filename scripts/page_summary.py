"""
BD Buddy — Summary Page: Academic Overview
Draws a table of all semesters with per-semester stats + overall totals.
"""

from reportlab.lib import colors
from reportlab.lib.units import mm

from shared import (
    PAGE_W, PAGE_H, MARGIN_LEFT, MARGIN_RIGHT, CONTENT_W,
    DARK_SLATE, TABLE_SLATE, BORDER_GRAY, BORDER_LIGHT,
    MUTED, TEXT_BLACK, BG_LIGHT, SUCCESS, SUCCESS_BG,
    ty,
    draw_security_layers, draw_standard_footer, draw_common_header,
)


def draw_summary_page(c, data, serial, print_date, verify_url):
    """Render the academic summary page."""

    draw_security_layers(c, watermark_text="ACADEMIC SUMMARY")
    draw_common_header(c, serial, print_date)

    bio = data.get("biography", {}) or {}
    regs = data.get("registrations", []) or []
    courses_by_sem = data.get("coursesBySemester", {}) or {}

    # ---------- Title ----------
    c.setFillColor(TEXT_BLACK)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(PAGE_W / 2, ty(40), "ACADEMIC SUMMARY")

    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8.5)
    c.drawCentredString(PAGE_W / 2, ty(46),
                        "All semesters at a glance — official BDU record")

    # ---------- Student info strip ----------
    y_ptr = 54
    c.setFillColor(TEXT_BLACK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(MARGIN_LEFT, ty(y_ptr), "Student:")
    c.drawString(110 * mm, ty(y_ptr), "Student ID:")

    c.setFont("Helvetica", 9)
    c.drawString(30 * mm, ty(y_ptr), str(bio.get("fullName", "—"))[:40])
    c.drawString(130 * mm, ty(y_ptr), str(bio.get("studentId", "—"))[:20])

    y_ptr += 5
    c.setFont("Helvetica-Bold", 9)
    c.drawString(MARGIN_LEFT, ty(y_ptr), "Program:")
    c.drawString(110 * mm, ty(y_ptr), "Total Semesters:")
    c.setFont("Helvetica", 9)
    c.drawString(30 * mm, ty(y_ptr), str(data.get("program", "—"))[:40])
    c.drawString(130 * mm, ty(y_ptr), str(len(regs)))

    # ---------- Column layout ----------
    # Columns: #, Semester, Academic Year, Courses, Credits, SGPA, CGPA, Status
    col_w = [8, 20, 30, 22, 22, 20, 20, 30]  # in mm, sums to ~172mm (fits CONTENT_W ~176)
    # Normalize to CONTENT_W
    total_w = sum(col_w)
    scale = CONTENT_W / (total_w * mm)
    col_w_mm = [w * mm * scale for w in col_w]
    headers = ["#", "Semester", "Academic Year", "Courses", "Credits", "SGPA", "CGPA", "Status"]

    # ---------- Header band ----------
    table_top = 68
    header_h = 7
    c.setFillColor(TABLE_SLATE)
    c.rect(MARGIN_LEFT, ty(table_top + header_h), CONTENT_W, header_h * mm,
           fill=1, stroke=0)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 7.5)
    x = MARGIN_LEFT + 2 * mm
    for w, h in zip(col_w_mm, headers):
        c.drawString(x, ty(table_top + 4.8), h)
        x += w

    # ---------- Data rows ----------
    row_h = 6.2
    y = table_top + header_h + 5.5
    total_credits = 0
    total_courses = 0

    for i, reg in enumerate(regs, start=1):
        sem_id = str(reg.get("semester", "—"))
        ac_year = str(reg.get("acYear", "—"))
        sgpa = str(reg.get("sgpa", "—"))
        cgpa = str(reg.get("cgpa", "—"))
        status = str(reg.get("status", "—"))

        sem_courses = courses_by_sem.get(sem_id, [])
        n_courses = len(sem_courses)
        n_credits = sum(float(x.get("credit", 0) or 0) for x in sem_courses)

        total_credits += n_credits
        total_courses += n_courses

        # Row background alternate
        if i % 2 == 0:
            c.setFillColor(BG_LIGHT)
            c.rect(MARGIN_LEFT, ty(y + 2), CONTENT_W, row_h * mm,
                   fill=1, stroke=0)

        c.setFillColor(TEXT_BLACK)
        c.setFont("Helvetica", 8)
        x = MARGIN_LEFT + 2 * mm
        vals = [str(i), sem_id, ac_year, str(n_courses),
                str(int(n_credits)) if n_credits == int(n_credits) else f"{n_credits:.1f}",
                sgpa, cgpa, status]
        for w, v in zip(col_w_mm, vals):
            c.drawString(x, ty(y), str(v)[:18])
            x += w

        y += row_h

    # ---------- Total row ----------
    c.setFillColor(TABLE_SLATE)
    c.rect(MARGIN_LEFT, ty(y + 2), CONTENT_W, row_h * mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 8)
    x = MARGIN_LEFT + 2 * mm
    final_cgpa = regs[-1].get("cgpa", "—") if regs else "—"
    totals = ["", "TOTAL", "", str(total_courses),
              str(int(total_credits)) if total_credits == int(total_credits) else f"{total_credits:.1f}",
              "", str(final_cgpa), ""]
    for w, v in zip(col_w_mm, totals):
        c.drawString(x, ty(y), str(v))
        x += w

    # ---------- Bottom border ----------
    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(0.5)
    c.line(MARGIN_LEFT, ty(y - 1), MARGIN_RIGHT, ty(y - 1))

    # ---------- Footnote ----------
    footnote_y = y + 12
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Oblique", 7.5)
    c.drawString(MARGIN_LEFT, ty(footnote_y),
                 "Cumulative GPA shown is the running CGPA reported by the portal for each semester.")
    c.drawString(MARGIN_LEFT, ty(footnote_y + 4),
                 "For official confirmation of any record, verify this document via the QR code on the cover page.")

    draw_standard_footer(c)
    c.showPage()
