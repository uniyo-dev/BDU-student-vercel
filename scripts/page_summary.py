"""
BD Buddy — Summary Table Helper
Draws the per-semester summary table used inline on the cover page.

Brand refresh (M5): uses design system tokens throughout.
Column alignment: numeric right-aligned, short values centered, long text left.
"""

from reportlab.lib import colors
from reportlab.lib.units import mm

from shared import (
    PAGE_W, MARGIN_LEFT, MARGIN_RIGHT, CONTENT_W,
    TABLE_SLATE, BORDER_GRAY, BORDER_LIGHT, MUTED,
    TEXT_BLACK, BG_LIGHT, BRAND_VIOLET,
    # Design system tokens
    T_H1, T_H2, T_H3, T_LABEL, T_BODY, T_BODY_SM, T_CAPTION, T_MICRO,
    RHYTHM_XS, RHYTHM_SM, RHYTHM_MD,
    RADIUS_SM, RADIUS_MD, RADIUS_LG,
    STROKE_HAIR, STROKE_THIN, STROKE_MED, STROKE_BOLD,
    ty,
)


# Column definitions: (width_mm_relative, header, align)
#   align: 'l' = left, 'r' = right, 'c' = center
_COLUMNS = [
    (8,  "#",              "c"),
    (20, "Semester",       "c"),
    (30, "Academic Year",  "l"),
    (22, "Courses",        "r"),
    (22, "Credits",        "r"),
    (20, "SGPA",           "r"),
    (20, "CGPA",           "r"),
    (30, "Status",         "c"),
]


def _draw_cell(c, x, y, text, align, font, size, color, width):
    """Draw a cell aligned within its column width."""
    c.setFillColor(color)
    c.setFont(font, size)
    s = str(text)

    if align == "r":
        c.drawRightString(x + width, ty(y), s)
    elif align == "c":
        c.drawCentredString(x + width / 2, ty(y), s)
    else:
        c.drawString(x, ty(y), s)


def draw_summary_table(c, data, top_y, max_rows=10):
    """Draw the academic summary table starting at top_y (mm).
    Returns the bottom Y (mm).
    """
    regs = data.get("registrations") or []
    courses_by_sem = data.get("coursesBySemester") or {}

    if not regs:
        return top_y

    # ─── Row height scales with semester count ────────────────
    n_rows = len(regs) + 1  # +1 for TOTAL
    row_h = 6.2
    if n_rows > 8:
        row_h = 5.4
    if n_rows > 10:
        row_h = 4.6

    # ─── Column widths (normalized to CONTENT_W) ──────────────
    content_w_mm = CONTENT_W / mm
    total_raw = sum(w for w, _, _ in _COLUMNS)
    col_w_mm = [(w * content_w_mm / total_raw) for w, _, _ in _COLUMNS]

    # ─── Section title ────────────────────────────────────────
    c.setFillColor(BRAND_VIOLET)
    c.setFont("Helvetica-Bold", T_H3)
    c.drawString(MARGIN_LEFT + 2 * mm, ty(top_y - 2), "ACADEMIC SUMMARY")

    # ─── Header band ──────────────────────────────────────────
    header_h = 6
    header_top = top_y + 3
    c.setFillColor(TABLE_SLATE)
    c.rect(MARGIN_LEFT, ty(header_top + header_h), CONTENT_W, header_h * mm,
           fill=1, stroke=0)

    x = MARGIN_LEFT + 2 * mm
    for (w, h, align) in _COLUMNS:
        _draw_cell(c, x, header_top + 3.8, h, align,
                   "Helvetica-Bold", T_CAPTION, colors.white, w)
        x += w

    # ─── Data rows ────────────────────────────────────────────
    y = header_top + header_h + 4.2
    total_credits = 0
    total_courses = 0

    for i, reg in enumerate(regs, start=1):
        sem_id   = str(reg.get("semester", "—"))
        ac_year  = str(reg.get("acYear", "—"))
        sgpa     = str(reg.get("sgpa", "—"))
        cgpa     = str(reg.get("cgpa", "—"))
        status   = str(reg.get("status", "—"))

        sem_courses = courses_by_sem.get(sem_id, [])
        n_courses = len(sem_courses)
        n_credits = sum(float(x.get("credit", 0) or 0) for x in sem_courses)

        total_credits += n_credits
        total_courses += n_courses

        # Zebra striping (odd rows)
        if i % 2 == 1:
            c.setFillColor(BG_LIGHT)
            c.rect(MARGIN_LEFT, ty(y + row_h * 0.7),
                   CONTENT_W, row_h * mm, fill=1, stroke=0)

        # Format credits
        credits_str = (str(int(n_credits))
                       if n_credits == int(n_credits)
                       else f"{n_credits:.1f}")

        values = [
            str(i),
            sem_id,
            ac_year,
            str(n_courses),
            credits_str,
            sgpa,
            cgpa,
            status,
        ]

        x = MARGIN_LEFT + 2 * mm
        for (w, _h, align), v in zip(_COLUMNS, values):
            _draw_cell(c, x, y, v, align,
                       "Helvetica", T_BODY_SM, TEXT_BLACK, w)
            x += w

        # Thin bottom divider (softer than before)
        c.setStrokeColor(BORDER_LIGHT)
        c.setLineWidth(STROKE_HAIR)
        c.line(MARGIN_LEFT, ty(y + row_h * 0.7 + 1),
               MARGIN_RIGHT, ty(y + row_h * 0.7 + 1))

        y += row_h

    # ─── TOTAL row ────────────────────────────────────────────
    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(STROKE_BOLD)
    c.line(MARGIN_LEFT, ty(y + 1.5), MARGIN_RIGHT, ty(y + 1.5))

    c.setFillColor(TABLE_SLATE)
    c.rect(MARGIN_LEFT, ty(y + 1.5 + row_h),
           CONTENT_W, row_h * mm, fill=1, stroke=0)

    final_cgpa = regs[-1].get("cgpa", "—") if regs else "—"
    credits_total_str = (str(int(total_credits))
                         if total_credits == int(total_credits)
                         else f"{total_credits:.1f}")

    totals = ["", "TOTAL", "", str(total_courses),
              credits_total_str, "", str(final_cgpa), ""]

    x = MARGIN_LEFT + 2 * mm
    for (w, _h, align), v in zip(_COLUMNS, totals):
        _draw_cell(c, x, y + 4, v, align,
                   "Helvetica-Bold", T_CAPTION, colors.white, w)
        x += w

    # Return bottom Y of the drawn table
    return y + row_h + 2
