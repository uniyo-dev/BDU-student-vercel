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
    # Design system tokens (M5 brand refresh)
    T_H1, T_H2, T_H3, T_LABEL, T_BODY, T_BODY_SM, T_CAPTION, T_MICRO, T_TINY,
    RHYTHM_XS, RHYTHM_SM, RHYTHM_MD, RHYTHM_LG,
    RADIUS_SM, RADIUS_MD, RADIUS_LG,
    STROKE_HAIR, STROKE_THIN, STROKE_MED, STROKE_BOLD,
    ty, logo_path, make_qr,
    draw_security_layers, draw_standard_footer, draw_common_header,
    draw_section_band, draw_card, draw_divider, draw_kv_row,
)

from page_summary import draw_summary_table


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
    accent_w = 4 * mm  # violet left stripe

    # Card body (BG_LIGHT, subtle border)
    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(STROKE_MED)
    c.setFillColor(BG_LIGHT)
    c.roundRect(MARGIN_LEFT, ty(card_y_top + card_h),
                CONTENT_W, card_h * mm, RADIUS_LG * mm, fill=1, stroke=1)

    # Violet accent stripe (left edge, rounded on outer corners only)
    # Draw a rounded rect the full card height then clip the right side.
    c.saveState()
    p = c.beginPath()
    p.roundRect(MARGIN_LEFT, ty(card_y_top + card_h),
                accent_w, card_h * mm, RADIUS_LG * mm)
    c.clipPath(p, stroke=0, fill=0)
    c.setFillColor(BRAND_VIOLET)
    c.rect(MARGIN_LEFT, ty(card_y_top + card_h),
           accent_w, card_h * mm, fill=1, stroke=0)
    c.restoreState()

    # Card title — spaced capitals
    c.setFillColor(BRAND_VIOLET)
    c.setFont("Helvetica-Bold", T_H3)
    c.drawString(MARGIN_LEFT + 9 * mm, ty(card_y_top + 8), "STUDENT PROFILE CARD")

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

    y_pos = card_y_top + 18
    for label, val in info_lines:
        # Label — small, muted, uppercase-feel
        c.setFont("Helvetica-Bold", T_CAPTION)
        c.setFillColor(MUTED)
        c.drawString(MARGIN_LEFT + 12 * mm, ty(y_pos), label.upper())

        # Value — bold, dark, larger
        c.setFont("Helvetica-Bold", T_BODY)
        c.setFillColor(TEXT_BLACK)
        c.drawString(MARGIN_LEFT + 55 * mm, ty(y_pos), str(val))

        y_pos += RHYTHM_MD

    # ---------- BD Buddy validation stamp (right side) ----------
    stamp_x = 145 * mm
    stamp_y_top = 145
    stamp_w = 45 * mm
    stamp_h = 20 * mm

    # Filled violet stamp body
    c.setFillColor(BRAND_VIOLET)
    c.roundRect(stamp_x, ty(stamp_y_top + 20), stamp_w, stamp_h,
                RADIUS_MD * mm, fill=1, stroke=0)

    # Gold inner ring
    ring_inset = 1.5 * mm
    c.setStrokeColor(colors.HexColor("#FCD34D"))
    c.setLineWidth(STROKE_THIN)
    c.roundRect(stamp_x + ring_inset,
                ty(stamp_y_top + 20 - ring_inset / mm),
                stamp_w - 2 * ring_inset,
                stamp_h - 2 * ring_inset,
                RADIUS_SM * mm,
                fill=0, stroke=1)

    # Stamp text — white/gold on violet
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", T_H3)
    c.drawCentredString(stamp_x + stamp_w / 2, ty(stamp_y_top + 6), "BD BUDDY")

    c.setFillColor(colors.HexColor("#FCD34D"))
    c.setFont("Helvetica-Bold", T_CAPTION)
    c.drawCentredString(stamp_x + stamp_w / 2, ty(stamp_y_top + 11.5), "PORTAL VALIDATED")

    c.setFillColor(colors.white)
    c.setFont("Helvetica", T_MICRO)
    c.drawCentredString(stamp_x + stamp_w / 2, ty(stamp_y_top + 16.5),
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
    c.setFont("Helvetica-Bold", T_H3)
    c.drawString(MARGIN_LEFT + 28 * mm, ty(qr_y_top + 7),
                 "ONLINE VERIFICATION SYSTEM")

    c.setFillColor(TABLE_SLATE)
    c.setFont("Helvetica", T_BODY_SM)
    c.drawString(MARGIN_LEFT + 28 * mm, ty(qr_y_top + 13),
                 "This academic summary is linked dynamically to the student portal databases.")
    c.drawString(MARGIN_LEFT + 28 * mm, ty(qr_y_top + 18),
                 f"To confirm authenticity, scan this QR code or navigate to: {verify_url[:50]}...")

    # ---------- Academic Summary table (inline) ----------
    # Draws all semesters at a glance. Positioned below the QR block.
    draw_summary_table(c, data, top_y=228)

    # ---------- Footer ----------
    draw_standard_footer(c)

    c.showPage()
