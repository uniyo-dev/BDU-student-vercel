"""
BD Buddy — Page 3: Official Grading Key, Trust Model & Document Info
"""

import os
from reportlab.lib import colors
from reportlab.lib.units import mm

from shared import (
    PAGE_W, PAGE_H, MARGIN_LEFT, MARGIN_RIGHT, CONTENT_W,
    BRAND_VIOLET, BDU_BLUE, DARK_SLATE, TABLE_SLATE,
    BORDER_GRAY, BORDER_LIGHT, MUTED, TEXT_BLACK,
    NAVY_BG, BADGE_GOLD, BG_LIGHT,
    DISCLAIMER_BG, DISCLAIMER_BORDER, DISCLAIMER_TITLE, DISCLAIMER_BODY,
    # Design system tokens (M5 brand refresh)
    T_H1, T_H2, T_H3, T_LABEL, T_BODY, T_BODY_SM, T_CAPTION, T_MICRO, T_TINY,
    RHYTHM_XS, RHYTHM_SM, RHYTHM_MD, RHYTHM_LG,
    RADIUS_SM, RADIUS_MD, RADIUS_LG,
    STROKE_HAIR, STROKE_THIN, STROKE_MED, STROKE_BOLD,
    ty, make_qr,
    draw_security_layers, draw_standard_footer, draw_common_header,
    draw_section_band, draw_card, draw_divider, draw_kv_row,
)


GRADES = [
    ("A+",  "4.00", "85+"),
    ("A",   "4.00", "85+"),
    ("A-",  "3.75", "80-84"),
    ("B+",  "3.50", "75-79"),
    ("B",   "3.00", "70-74"),
    ("B-",  "2.75", "65-69"),
    ("C+",  "2.50", "60-64"),
    ("C",   "2.00", "50-59"),
    ("D",   "1.00", "40-49"),
    ("F",   "0.00", "<40"),
]


# ============================================================
# GRADING TABLE (single row)
# ============================================================
def _draw_grading_table(c, top_y):
    """Simplified grading table — three rows, subtle dividers, no gridlines."""
    cell_w = CONTENT_W / 10.0
    table_x = MARGIN_LEFT
    table_h = 16

    # Outer border (thin)
    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(STROKE_THIN)
    c.rect(table_x, ty(top_y + table_h), CONTENT_W, table_h * mm,
           fill=0, stroke=1)

    # Two horizontal dividers separating the three logical rows
    c.setStrokeColor(BORDER_LIGHT)
    c.setLineWidth(STROKE_HAIR)
    c.line(table_x, ty(top_y + 5.5), table_x + CONTENT_W, ty(top_y + 5.5))
    c.line(table_x, ty(top_y + 10.5), table_x + CONTENT_W, ty(top_y + 10.5))

    # Content — no vertical lines, just spacing
    for i, (grade, points, rng) in enumerate(GRADES):
        cx = table_x + i * cell_w + cell_w / 2

        c.setFillColor(BRAND_VIOLET)
        c.setFont("Helvetica-Bold", T_H3)
        c.drawCentredString(cx, ty(top_y + 3.8), grade)

        c.setFillColor(TABLE_SLATE)
        c.setFont("Helvetica-Bold", T_CAPTION)
        c.drawCentredString(cx, ty(top_y + 8.5), points)

        c.setFillColor(MUTED)
        c.setFont("Helvetica", T_MICRO)
        c.drawCentredString(cx, ty(top_y + 13.5), rng)


# ============================================================
# DISCLAIMER (Option C: left title + right content)
# ============================================================
def _draw_disclaimer(c, top_y, height):
    box_x = MARGIN_LEFT
    box_w = CONTENT_W

    # Background box
    c.setFillColor(DISCLAIMER_BG)
    c.setStrokeColor(DISCLAIMER_BORDER)
    c.setLineWidth(0.8)
    c.roundRect(box_x, ty(top_y + height), box_w, height * mm, 3 * mm, fill=1, stroke=1)

    # Left title area (55mm wide)
    title_x = box_x + 6 * mm
    title_w = 50 * mm

    # Vertical divider between title and content
    divider_x = box_x + 60 * mm
    c.setStrokeColor(DISCLAIMER_BORDER)
    c.setLineWidth(0.4)
    c.line(divider_x, ty(top_y + height - 4), divider_x, ty(top_y + 4))

    # Warning icon (triangle)
    icon_cx = title_x + title_w / 2
    icon_cy = top_y + 12

    c.setStrokeColor(DISCLAIMER_TITLE)
    c.setFillColor(DISCLAIMER_TITLE)
    c.setLineWidth(0.8)
    icon_s = 6 * mm
    p = c.beginPath()
    p.moveTo(icon_cx, ty(icon_cy - 4))
    p.lineTo(icon_cx - icon_s / 2, ty(icon_cy + 3))
    p.lineTo(icon_cx + icon_s / 2, ty(icon_cy + 3))
    p.close()
    c.drawPath(p, stroke=1, fill=0)

    # Exclamation inside triangle
    c.setLineWidth(0.8)
    c.line(icon_cx, ty(icon_cy - 2), icon_cx, ty(icon_cy + 1))
    c.circle(icon_cx, ty(icon_cy + 2.3), 0.4, fill=1, stroke=0)

    # Title text — stacked lines
    c.setFillColor(DISCLAIMER_TITLE)
    c.setFont("Helvetica-Bold", 11)

    title_lines = [
        "CRITICAL",
        "DISCLAIMER",
        "& TRUST",
        "STANDARD",
    ]
    ty_line = top_y + 20
    for line in title_lines:
        c.drawCentredString(icon_cx, ty(ty_line), line)
        ty_line += 6

    # Right content area (starts at X = 65mm)
    content_x = box_x + 65 * mm
    content_w = box_w - 65 * mm - 4 * mm  # right margin

    body_blocks = [
        (
            "",
            [
                "BD Buddy is an UNOFFICIAL, student-built utility platform built",
                "to visualize live student portal data. This document is NOT",
                "officially compiled by BDU Administration.",
            ],
        ),
        (
            "",
            [
                "NO personal student credentials or academic transcripts are",
                "stored on our servers.",
            ],
        ),
        (
            "",
            [
                "The QR verification only confirms the ORIGIN of this document",
                "was generated by BD Buddy. It does not verify BDU's official seal.",
            ],
        ),
        (
            "",
            [
                "For official administrative use, always trust:",
                "    - studentportal.bdu.edu.et",
                "    - BDU Registrar Office",
                "    - BDU IT Department",
            ],
        ),
    ]

    c.setFillColor(DISCLAIMER_BODY)
    c.setFont("Helvetica", T_CAPTION)

    y_body = top_y + 8
    for _label, lines in body_blocks:
        for line in lines:
            c.drawString(content_x, ty(y_body), line)
            y_body += 3.2
        y_body += 1.4  # block spacing


# ============================================================
# DOCUMENT METADATA PANEL
# ============================================================
def _draw_metadata_panel(c, top_y, serial, print_date, print_mode, data):
    box_x = MARGIN_LEFT
    box_w = CONTENT_W
    box_h = 26

    c.setFillColor(BG_LIGHT)
    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(0.4)
    c.rect(box_x, ty(top_y + box_h), box_w, box_h * mm, fill=1, stroke=1)

    # Title band
    c.setFillColor(TABLE_SLATE)
    c.rect(box_x, ty(top_y + 6), box_w, 6 * mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(box_x + 3 * mm, ty(top_y + 4.5), "DOCUMENT METADATA")

    # Two-column layout of metadata
    from datetime import datetime

    now = datetime.now()

    report_type = {
        "Cumulative": "Cumulative Grade Sheet",
        "Semester I": "Semester I Grade Report",
        "Semester II": "Semester II Grade Report",
    }.get(print_mode, "Grade Report")

    left_items = [
        ("Report Type:", report_type),
        ("Generator:", "BD Buddy v3.0"),
        ("Document ID:", serial),
    ]

    right_items = [
        ("Generated:", f"{print_date} at {now.strftime('%H:%M')}"),
        ("Format:", "A4 Portrait / 3-Page Certificate"),
        ("Verification:", "QR + Crypt-Checksum"),
    ]

    c.setFillColor(TEXT_BLACK)
    y_item = top_y + 12

    for (lbl, val) in left_items:
        c.setFont("Helvetica-Bold", T_CAPTION)
        c.setFillColor(MUTED)
        c.drawString(box_x + 5 * mm, ty(y_item), lbl.upper())
        # Document ID uses monospace (Courier) for alignment
        if lbl == "Document ID:":
            c.setFont("Courier", T_MICRO + 0.5)
            c.setFillColor(TEXT_BLACK)
            c.drawString(box_x + 32 * mm, ty(y_item), val)
        else:
            c.setFont("Helvetica-Bold", T_BODY_SM)
            c.setFillColor(TEXT_BLACK)
            c.drawString(box_x + 32 * mm, ty(y_item), val[:60])
        y_item += RHYTHM_MD - 2

    y_item = top_y + 12
    for (lbl, val) in right_items:
        c.setFont("Helvetica-Bold", T_CAPTION)
        c.setFillColor(MUTED)
        c.drawString(box_x + 100 * mm, ty(y_item), lbl.upper())
        c.setFont("Helvetica-Bold", T_BODY_SM)
        c.setFillColor(TEXT_BLACK)
        c.drawString(box_x + 125 * mm, ty(y_item), val)
        y_item += RHYTHM_MD - 2


# ============================================================
# ABOUT + CONTACT (side by side)
# ============================================================
def _draw_about_contact(c, top_y, height):
    gap = 4 * mm
    col_w = (CONTENT_W - gap) / 2

    left_x = MARGIN_LEFT
    right_x = MARGIN_LEFT + col_w + gap

    # ---- Left: About BD Buddy ----
    c.setFillColor(BG_LIGHT)
    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(0.4)
    c.rect(left_x, ty(top_y + height), col_w, height * mm, fill=1, stroke=1)

    c.setFillColor(TABLE_SLATE)
    c.rect(left_x, ty(top_y + 6), col_w, 6 * mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(left_x + 3 * mm, ty(top_y + 4.5), "ABOUT BD BUDDY")

    c.setFillColor(TEXT_BLACK)
    c.setFont("Helvetica", 8)
    y_l = top_y + 12
    about_lines = [
        "Free, student-built viewer for the BDU",
        "student portal. Presents real academic",
        "data in a clean, mobile-first interface.",
        "",
        "Live: bdu-portal.onrender.com",
        "Source: github.com/uniyo-dev/",
        "        BDU-student-vercel",
    ]
    for line in about_lines:
        c.drawString(left_x + 4 * mm, ty(y_l), line)
        y_l += 3.5

    # ---- Right: Contact ----
    c.setFillColor(BG_LIGHT)
    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(0.4)
    c.rect(right_x, ty(top_y + height), col_w, height * mm, fill=1, stroke=1)

    c.setFillColor(TABLE_SLATE)
    c.rect(right_x, ty(top_y + 6), col_w, 6 * mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(right_x + 3 * mm, ty(top_y + 4.5), "SUPPORT & CONTACT")

    c.setFillColor(TEXT_BLACK)
    c.setFont("Helvetica", 8)
    y_r = top_y + 12
    contact_rows = [
        ("Project:", "BD Buddy"),
        ("Telegram:", "@challengepr"),
        ("Email:", "chalachewagegn7@gmail.com"),
    ]
    for (lbl, val) in contact_rows:
        c.setFont("Helvetica-Bold", 8)
        c.drawString(right_x + 4 * mm, ty(y_r), lbl)
        c.setFont("Helvetica", 8)
        c.drawString(right_x + 22 * mm, ty(y_r), val)
        y_r += 4.5


# ============================================================
# QR GATEWAY
# ============================================================
def _draw_qr_gateway(c, top_y, verify_url):
    qr_h = 24

    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(0.4)
    c.setDash(2, 2)
    c.rect(MARGIN_LEFT, ty(top_y + qr_h), CONTENT_W, qr_h * mm, fill=0, stroke=1)
    c.setDash()

    qr_img = make_qr(verify_url)
    c.drawImage(qr_img, MARGIN_LEFT + 3 * mm, ty(top_y + qr_h - 2),
                width=18 * mm, height=18 * mm, mask='auto')

    c.setFillColor(TEXT_BLACK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(MARGIN_LEFT + 25 * mm, ty(top_y + 7),
                 "OFFICIAL VERIFICATION GATEWAY")

    c.setFillColor(TABLE_SLATE)
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN_LEFT + 25 * mm, ty(top_y + 13),
                 "Verify structural signature online. Unaltered authentic files pass")
    c.drawString(MARGIN_LEFT + 25 * mm, ty(top_y + 17),
                 "crypt-checksum validations.")

    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.5)
    c.drawString(MARGIN_LEFT + 25 * mm, ty(top_y + 21),
                 f"Verification Token: {verify_url[:70]}")


# ============================================================
# MAIN PAGE 3 ENTRY
# ============================================================
def draw_page_three(c, data, serial, print_date, verify_url):
    """Render page 3 onto canvas c."""

    draw_security_layers(c, watermark_text="RULES KEY")
    draw_common_header(c, serial, print_date)

    # Page titles
    c.setFillColor(TEXT_BLACK)
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(PAGE_W / 2, ty(36), "BAHIR DAR UNIVERSITY")

    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(PAGE_W / 2, ty(42), "OFFICIAL GRADING KEY SYSTEM")

    # Grading table header band
    band_top = 50
    band_h = 5
    c.setFillColor(DARK_SLATE)
    c.rect(MARGIN_LEFT, ty(band_top + band_h), CONTENT_W, band_h * mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(MARGIN_LEFT + 3 * mm, ty(band_top + 3.5),
                 "BAHIR DAR UNIVERSITY GRADING BENCHMARKS")

    # Grading table
    _draw_grading_table(c, top_y=57)

    # Disclaimer — compressed height (was 55mm)
    _draw_disclaimer(c, top_y=78, height=45)

    # Metadata panel — pulls up to fill the saved space
    print_mode = data.get("printMode", "Cumulative")
    _draw_metadata_panel(c, top_y=128, serial=serial,
                         print_date=print_date, print_mode=print_mode, data=data)

    # About + Contact side-by-side
    _draw_about_contact(c, top_y=160, height=28)

    # QR gateway
    _draw_qr_gateway(c, top_y=193, verify_url=verify_url)

    # Footer
    draw_standard_footer(c)
    c.showPage()
