"""
BD Buddy — Page 1: Cover Page & Student Profile Summary
"""

from reportlab.lib import colors
from reportlab.lib.units import mm

from shared import (
    PAGE_W, PAGE_H, MARGIN_LEFT, MARGIN_RIGHT, CONTENT_W,
    BRAND_VIOLET, BDU_BLUE, DARK_SLATE, TABLE_SLATE,
    BORDER_GRAY, BORDER_LIGHT, MUTED, MUTED_LIGHT,
    TEXT_BLACK, BG_LIGHT,
    ty, logo_path, make_qr,
    draw_security_layers, draw_standard_footer, draw_common_header,
)


def draw_page_one(c, data, serial, print_date, verify_url):
    """Render the cover page onto canvas c."""

    # Background
    draw_security_layers(c, watermark_text="ACADEMIC COVER")

    # Common header
    draw_common_header(c, serial, print_date)

    # ---------- Page title ----------
    c.setFillColor(TEXT_BLACK)
    c.setFont("Helvetica-Bold", 15)
    c.drawCentredString(PAGE_W / 2, ty(48), "BAHIR DAR UNIVERSITY")

    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(PAGE_W / 2, ty(55), "ACADEMIC PORTAL RECORD SUMMARY")

    # ---------- Student profile card ----------
    card_y_top = 68
    card_h = 60

    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(0.8)
    c.setFillColor(BG_LIGHT)
    c.roundRect(MARGIN_LEFT, ty(card_y_top + card_h),
                CONTENT_W, card_h * mm, 4 * mm, fill=1, stroke=1)

    # Card title
    c.setFillColor(TEXT_BLACK)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN_LEFT + 8 * mm, ty(card_y_top + 8), "STUDENT PROFILE CARD")

    # Card content
    bio = data.get("biography", {}) or {}
    reg = data.get("registration", {}) or {}
    summary = data.get("summary", {}) or {}

    info_lines = [
        ("Full Student Name:", bio.get("fullName", "-")),
        ("ID Number:", bio.get("studentId", "-")),
        ("Academic Program:", reg.get("program", "-")),
        ("Latest Semester:", f"Semester {reg.get('semester', '-')} ({reg.get('acYear', '-')})"),
        ("Cumulative CGPA:", f"{summary.get('cumulativeGPA', '-')} / 4.00"),
        ("Academic Standing:", reg.get("status", "-")),
    ]

    y_pos = card_y_top + 16
    for label, val in info_lines:
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(TEXT_BLACK)
        c.drawString(MARGIN_LEFT + 10 * mm, ty(y_pos), label)
        c.setFont("Helvetica", 9.5)
        c.drawString(MARGIN_LEFT + 55 * mm, ty(y_pos), str(val))
        y_pos += 7

    # ---------- BD Buddy validation stamp (right side) ----------
    stamp_x = 145 * mm
    stamp_y_top = 145
    stamp_w = 45 * mm
    stamp_h = 20 * mm

    c.setStrokeColor(BRAND_VIOLET)
    c.setLineWidth(1)
    c.setFillColor(colors.white)
    c.roundRect(stamp_x, ty(stamp_y_top + 20), stamp_w, stamp_h, 2 * mm, fill=1, stroke=1)

    c.setFillColor(BRAND_VIOLET)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(stamp_x + stamp_w / 2, ty(stamp_y_top + 6), "BD BUDDY")

    c.setFont("Helvetica", 7.5)
    c.drawCentredString(stamp_x + stamp_w / 2, ty(stamp_y_top + 12), "PORTAL VALIDATED")

    c.setFont("Helvetica-Bold", 6.5)
    c.drawCentredString(stamp_x + stamp_w / 2, ty(stamp_y_top + 17),
                        print_date.upper())

    # ---------- QR verification section ----------
    qr_y_top = 180
    qr_h = 24

    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(0.4)
    c.setDash(2, 2)
    c.rect(MARGIN_LEFT, ty(qr_y_top + qr_h), CONTENT_W, qr_h * mm, fill=0, stroke=1)
    c.setDash()

    qr_img = make_qr(verify_url)
    c.drawImage(qr_img, MARGIN_LEFT + 4 * mm, ty(qr_y_top + qr_h - 2),
                width=18 * mm, height=18 * mm, mask='auto')

    c.setFillColor(TEXT_BLACK)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(MARGIN_LEFT + 28 * mm, ty(qr_y_top + 7),
                 "ONLINE VERIFICATION SYSTEM")

    c.setFillColor(TABLE_SLATE)
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN_LEFT + 28 * mm, ty(qr_y_top + 13),
                 "This academic summary is linked dynamically to the student portal databases.")
    c.drawString(MARGIN_LEFT + 28 * mm, ty(qr_y_top + 18),
                 f"To confirm authenticity, scan this QR code or navigate to: {verify_url[:50]}...")

    # ---------- Footer ----------
    draw_standard_footer(c)

    c.showPage()
