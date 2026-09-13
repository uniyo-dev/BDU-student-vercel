"""
BD Buddy — Summary Table Helper
Draws the per-semester summary table. Used inline on the cover page.
"""

from reportlab.lib import colors
from reportlab.lib.units import mm

from shared import (
    PAGE_W, MARGIN_LEFT, MARGIN_RIGHT, CONTENT_W,
    TABLE_SLATE, BORDER_GRAY, MUTED, TEXT_BLACK, BG_LIGHT,
    ty,
)


def draw_summary_table(c, data, top_y, max_rows=10):
    """Draw the academic summary table starting at top_y (in mm, PDF coords).
    Returns the bottom Y (in mm, PDF coords) of the drawn table.
    """

    regs = data.get("registrations") or []
    courses_by_sem = data.get("coursesBySemester") or {}

    if not regs:
        return top_y

    # Adapt row height if many semesters
    n_rows = len(regs) + 1  # +1 for TOTAL
    row_h = 6.2
    if n_rows > 8:
        row_h = 5.4
    if n_rows > 10:
        row_h = 4.6

    # Column widths (mm), normalized so their sum == CONTENT_W / mm
    col_w_mm_raw = [8, 20, 30, 22, 22, 20, 20, 30]
    total_raw = sum(col_w_mm_raw)
    content_w_mm = CONTENT_W / mm
    col_w_mm = [w * content_w_mm / total_raw for w in col_w_mm_raw]

    headers = ["#", "Semester", "Academic Year", "Courses", "Credits", "SGPA", "CGPA", "Status"]

    # --- Section label above the table ---
    c.setFillColor(TEXT_BLACK)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(MARGIN_LEFT + 2 * mm, ty(top_y - 2), "ACADEMIC SUMMARY")

    # --- Header band ---
    header_h = 6
    header_top = top_y + 3
    c.setFillColor(TABLE_SLATE)
    c.rect(MARGIN_LEFT, ty(header_top + header_h), CONTENT_W, header_h * mm,
           fill=1, stroke=0)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 7)
    x = MARGIN_LEFT + 2 * mm
    for w, h in zip(col_w_mm, headers):
        c.drawString(x, ty(header_top + 3.8), h)
        x += w

    # --- Data rows ---
    y = header_top + header_h + 4.2
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

        # Alternating background
        if i % 2 == 0:
            c.setFillColor(BG_LIGHT)
            c.rect(MARGIN_LEFT, ty(y + 1.5), CONTENT_W, row_h * mm,
                   fill=1, stroke=0)

        c.setFillColor(TEXT_BLACK)
        c.setFont("Helvetica", 7.5)
        x = MARGIN_LEFT + 2 * mm
        vals = [str(i), sem_id, ac_year, str(n_courses),
                str(int(n_credits)) if n_credits == int(n_credits) else f"{n_credits:.1f}",
                sgpa, cgpa, status]
        for w, v in zip(col_w_mm, vals):
            c.drawString(x, ty(y), str(v)[:18])
            x += w

        y += row_h

    # --- TOTAL row ---
    c.setFillColor(TABLE_SLATE)
    c.rect(MARGIN_LEFT, ty(y + 1.5), CONTENT_W, row_h * mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 7.5)
    x = MARGIN_LEFT + 2 * mm
    final_cgpa = regs[-1].get("cgpa", "—") if regs else "—"
    totals = ["", "TOTAL", "", str(total_courses),
              str(int(total_credits)) if total_credits == int(total_credits) else f"{total_credits:.1f}",
              "", str(final_cgpa), ""]
    for w, v in zip(col_w_mm, totals):
        c.drawString(x, ty(y), str(v))
        x += w

    # Bottom border
    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(0.5)
    c.line(MARGIN_LEFT, ty(y), MARGIN_RIGHT, ty(y))

    # Return bottom Y (mm)
    return y - 2
