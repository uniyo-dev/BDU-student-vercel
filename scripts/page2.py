"""
BD Buddy — Page 2: Semester Grade Report
- Single-semester modes: single-column course table
- Cumulative mode: two-column table (Sem I left, Sem II right)
"""

from reportlab.lib import colors
from reportlab.lib.units import mm

from shared import (
    PAGE_W, PAGE_H, MARGIN_LEFT, MARGIN_RIGHT, CONTENT_W,
    BRAND_VIOLET, BDU_BLUE, DARK_SLATE, TABLE_SLATE,
    BORDER_GRAY, BORDER_LIGHT, MUTED, TEXT_BLACK,
    SUCCESS, SUCCESS_BG, NAVY_BG, BADGE_GOLD,
    HOLOGRAM_GOLD, BG_LIGHT,
    ty, logo_path, signature_registrar_path, signature_dean_path, stamp_path,
    make_qr, make_barcode,
    draw_security_layers, draw_standard_footer, draw_common_header,
)


# ============================================================
# COURSE FILTERING
# ============================================================
def filter_courses(courses, print_mode):
    result = []
    for crs in courses:
        sem_id = str(crs.get("semester", "I"))
        if print_mode == "Semester I" and sem_id != "I":
            continue
        if print_mode == "Semester II" and sem_id != "II":
            continue
        result.append(crs)
    return result


# ============================================================
# SINGLE-COLUMN COURSE TABLE
# ============================================================
def draw_single_column_table(c, courses, top_y):
    """Draws a single-column course table; returns bottom Y."""
    header_h = 6
    row_h = 5.0
    font_size = 8.5

    if len(courses) > 14:
        row_h = max(3.5, 65.0 / max(1, len(courses)))
        font_size = max(7.0, 8.5 * (row_h / 5.0))

    col_x = [
        MARGIN_LEFT + 2 * mm,
        MARGIN_LEFT + 22 * mm,
        105 * mm,
        112 * mm,
        130 * mm,
        150 * mm,
    ]
    headers = ["Code", "Course Title", "Cr", "Gr", "Pts", "%"]

    # Header band
    c.setFillColor(TABLE_SLATE)
    c.rect(MARGIN_LEFT, ty(top_y + header_h), CONTENT_W, header_h * mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 8)
    for x, h in zip(col_x, headers):
        c.drawString(x, ty(top_y + 4), h)

    # Rows
    y = top_y + header_h + 4
    c.setFillColor(TEXT_BLACK)
    for crs in courses:
        c.setFont("Helvetica", font_size)
        c.drawString(col_x[0], ty(y), str(crs.get('code', '')))
        c.drawString(col_x[1], ty(y), str(crs.get('title', ''))[:45])
        c.drawString(col_x[2], ty(y), str(crs.get('credit', '')))

        c.setFont("Helvetica-Bold", font_size)
        c.drawString(col_x[3], ty(y), str(crs.get('grade', '')))

        c.setFont("Helvetica", font_size)
        c.drawString(col_x[4], ty(y), str(crs.get('points', '')))

        pct = crs.get('percentage', '')
        c.drawString(col_x[5], ty(y), f"{pct}%" if pct else "-")

        c.setStrokeColor(BORDER_LIGHT)
        c.setLineWidth(0.3)
        c.line(MARGIN_LEFT, ty(y + 2), MARGIN_RIGHT, ty(y + 2))
        y += row_h

    # Bottom border
    bottom = y + 2
    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(0.5)
    c.line(MARGIN_LEFT, ty(bottom), MARGIN_RIGHT, ty(bottom))
    return bottom


# ============================================================
# TWO-COLUMN COURSE TABLE (CUMULATIVE MODE)
# ============================================================
def draw_two_column_table(c, sem1_courses, sem2_courses, top_y):
    """Draws two side-by-side sub-tables; returns bottom Y."""

    # Geometry
    col_w = 92 * mm
    gutter = 6 * mm
    left_x = MARGIN_LEFT
    right_x = MARGIN_LEFT + col_w + gutter

    label_h = 5      # Semester I / Semester II label above header
    header_h = 6     # sub-table header height
    row_h = 5.0
    font_size = 8.0

    max_rows = max(len(sem1_courses), len(sem2_courses))
    if max_rows > 10:
        row_h = max(4.0, 55.0 / max(1, max_rows))
        font_size = max(7.0, 8.0 * (row_h / 5.0))

    # Sub-table header column offsets (relative to left_x / right_x)
    rel_code = 2 * mm
    rel_title = 18 * mm
    rel_cr = 66 * mm
    rel_gr = 76 * mm
    headers = ["Code", "Course Title", "Cr", "Gr"]

    # ---- Semester labels above sub-tables ----
    c.setFillColor(DARK_SLATE)
    c.rect(left_x, ty(top_y + label_h), col_w, label_h * mm, fill=1, stroke=0)
    c.rect(right_x, ty(top_y + label_h), col_w, label_h * mm, fill=1, stroke=0)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(left_x + col_w / 2, ty(top_y + 3.5), "SEMESTER I")
    c.drawCentredString(right_x + col_w / 2, ty(top_y + 3.5), "SEMESTER II")

    # ---- Sub-table headers ----
    header_top = top_y + label_h
    c.setFillColor(TABLE_SLATE)
    c.rect(left_x, ty(header_top + header_h), col_w, header_h * mm, fill=1, stroke=0)
    c.rect(right_x, ty(header_top + header_h), col_w, header_h * mm, fill=1, stroke=0)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 7)
    for rel_x, h in zip([rel_code, rel_title, rel_cr, rel_gr], headers):
        c.drawString(left_x + rel_x, ty(header_top + 4), h)
        c.drawString(right_x + rel_x, ty(header_top + 4), h)

    # ---- Rows ----
    row_start_y = header_top + header_h + 4

    # Left column (Sem I)
    y_l = row_start_y
    c.setFillColor(TEXT_BLACK)
    for crs in sem1_courses:
        c.setFont("Helvetica", font_size)
        c.drawString(left_x + rel_code, ty(y_l), str(crs.get('code', ''))[:12])
        c.drawString(left_x + rel_title, ty(y_l), str(crs.get('title', ''))[:30])
        c.drawString(left_x + rel_cr, ty(y_l), str(crs.get('credit', '')))
        c.setFont("Helvetica-Bold", font_size)
        c.drawString(left_x + rel_gr, ty(y_l), str(crs.get('grade', '')))

        c.setStrokeColor(BORDER_LIGHT)
        c.setLineWidth(0.3)
        c.line(left_x, ty(y_l + 2), left_x + col_w, ty(y_l + 2))
        y_l += row_h

    # Right column (Sem II)
    y_r = row_start_y
    c.setFillColor(TEXT_BLACK)
    for crs in sem2_courses:
        c.setFont("Helvetica", font_size)
        c.drawString(right_x + rel_code, ty(y_r), str(crs.get('code', ''))[:12])
        c.drawString(right_x + rel_title, ty(y_r), str(crs.get('title', ''))[:30])
        c.drawString(right_x + rel_cr, ty(y_r), str(crs.get('credit', '')))
        c.setFont("Helvetica-Bold", font_size)
        c.drawString(right_x + rel_gr, ty(y_r), str(crs.get('grade', '')))

        c.setStrokeColor(BORDER_LIGHT)
        c.setLineWidth(0.3)
        c.line(right_x, ty(y_r + 2), right_x + col_w, ty(y_r + 2))
        y_r += row_h

    # ---- Bottom borders ----
    bottom_l = y_l + 2
    bottom_r = y_r + 2
    bottom = max(bottom_l, bottom_r)

    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(0.5)
    c.line(left_x, ty(bottom), left_x + col_w, ty(bottom))
    c.line(right_x, ty(bottom), right_x + col_w, ty(bottom))

    return bottom


# ============================================================
# MAIN PAGE 2 RENDERER
# ============================================================
def draw_page_two(c, data, serial, print_date, verify_url):
    # Background
    draw_security_layers(c, watermark_text="OFFICIAL VERIFIED")

    # Common header
    draw_common_header(c, serial, print_date)

    bio = data.get("biography", {}) or {}
    reg = data.get("registration", {}) or {}
    summary = data.get("summary", {}) or {}
    print_mode = data.get("printMode", "Cumulative")

    # ---------- University title ----------
    c.setFillColor(TEXT_BLACK)
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(PAGE_W / 2, ty(36), "BAHIR DAR UNIVERSITY")

    # ---------- Report title + SECURE badge ----------
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(PAGE_W / 2 - 10 * mm, ty(42), "SEMESTER GRADE REPORT")

    badge_w, badge_h = 24 * mm, 4 * mm
    badge_x = PAGE_W / 2 + 30 * mm
    c.setFillColor(SUCCESS_BG)
    c.roundRect(badge_x, ty(44), badge_w, badge_h, 1.5 * mm, fill=1, stroke=0)
    c.setFillColor(SUCCESS)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(badge_x + 4.5 * mm, ty(43.2), "SECURE")

    # ---------- Student info table ----------
    y_ptr = 52
    lbl_x1, val_x1 = MARGIN_LEFT, 36 * mm
    lbl_x2, val_x2 = 108 * mm, 134 * mm

    info_rows = [
        ("Student:", bio.get("fullName", "-"), "Student ID:", bio.get("studentId", "-")),
        ("Program:", reg.get("program", "-"), "Academic Year:", reg.get("acYear", "-")),
        ("Semester:", reg.get("semester", "-"), "Total Credits:", str(summary.get("totalCredits", "-"))),
        ("Cumulative GPA:", str(summary.get("cumulativeGPA", "-")), "Status:", reg.get("status", "-")),
    ]

    for lbl_l, val_l, lbl_r, val_r in info_rows:
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(TEXT_BLACK)
        c.drawString(lbl_x1, ty(y_ptr), lbl_l)
        c.drawString(lbl_x2, ty(y_ptr), lbl_r)

        c.setFont("Helvetica", 10)
        c.drawString(val_x1, ty(y_ptr), str(val_l)[:38])
        c.drawString(val_x2, ty(y_ptr), str(val_r)[:38])
        y_ptr += 5.5

    # ---------- Semester band ----------
    band_text = f"Semester {reg.get('semester', '-')} ({reg.get('acYear', '-')})"
    if print_mode == "Semester I":
        band_text = f"Semester I ({reg.get('acYear', '-')})"
    elif print_mode == "Semester II":
        band_text = f"Semester II ({reg.get('acYear', '-')})"
    elif print_mode == "Cumulative":
        band_text = f"Cumulative Grade Sheet ({reg.get('acYear', '-')})"

    band_top = 76
    band_h = 8
    c.setFillColor(DARK_SLATE)
    c.rect(MARGIN_LEFT, ty(band_top + band_h), CONTENT_W, band_h * mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN_LEFT + 3 * mm, ty(band_top + 5.5), band_text)

    # ---------- Course table ----------
    table_top = band_top + band_h + 3

    if print_mode == "Cumulative":
        sem1 = [crs for crs in (data.get("courses", []) or [])
                if str(crs.get("semester", "I")) == "I"]
        sem2 = [crs for crs in (data.get("courses", []) or [])
                if str(crs.get("semester", "II")) == "II"]
        table_bottom = draw_two_column_table(c, sem1, sem2, table_top)
    else:
        courses = filter_courses(data.get("courses", []) or [], print_mode)
        table_bottom = draw_single_column_table(c, courses, table_top)

    # ---------- SGPA / CGPA summary ----------
    sgpa_y = table_bottom + 7
    c.setFillColor(TEXT_BLACK)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN_LEFT, ty(sgpa_y), f"SGPA: {summary.get('sgpa', '-')}")
    c.drawString(MARGIN_LEFT + 45 * mm, ty(sgpa_y), f"CGPA: {summary.get('cumulativeGPA', '-')}")
    c.drawRightString(MARGIN_RIGHT, ty(sgpa_y), f"Status: {reg.get('status', '-')}")

    # ---------- Barcode + hologram ----------
    barcode_top = sgpa_y + 8
    barcode_h = 16
    barcode_bottom = barcode_top + barcode_h

    c.setFillColor(BG_LIGHT)
    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(0.4)
    c.rect(MARGIN_LEFT, ty(barcode_bottom), CONTENT_W, barcode_h * mm, fill=1, stroke=1)

    barcode_img = make_barcode(serial)
    if barcode_img:
        c.drawImage(barcode_img, MARGIN_LEFT + 5 * mm, ty(barcode_bottom - 3),
                    width=80 * mm, height=11 * mm, mask='auto')

    # Serial text below barcode
    c.setFillColor(TABLE_SLATE)
    c.setFont("Courier-Bold", 6.5)
    c.drawString(MARGIN_LEFT + 5 * mm, ty(barcode_bottom - 1), serial)

    # Hologram
    holo_cy = barcode_top + 8
    c.setFillColor(HOLOGRAM_GOLD)
    c.circle(182 * mm, ty(holo_cy), 6 * mm, fill=1, stroke=1)
    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(0.6)
    c.circle(182 * mm, ty(holo_cy), 6 * mm, fill=0, stroke=1)
    c.setFillColor(DARK_SLATE)
    c.setFont("Helvetica-Bold", 6)
    c.drawCentredString(182 * mm, ty(holo_cy + 1), "BDU")

    # ---------- QR verification ----------
    qr_top = barcode_bottom + 6
    qr_h = 24
    qr_bottom = qr_top + qr_h

    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(0.4)
    c.setDash(2, 2)
    c.rect(MARGIN_LEFT, ty(qr_bottom), CONTENT_W, qr_h * mm, fill=0, stroke=1)
    c.setDash()

    qr_img = make_qr(verify_url)
    c.drawImage(qr_img, MARGIN_LEFT + 3 * mm, ty(qr_bottom - 2),
                width=18 * mm, height=18 * mm, mask='auto')

    c.setFillColor(TEXT_BLACK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(MARGIN_LEFT + 25 * mm, ty(qr_top + 7), "VERIFICATION QR")

    # VERIFIED LINK badge
    c.setFillColor(NAVY_BG)
    c.roundRect(MARGIN_LEFT + 55 * mm, ty(qr_top + 9),
                30 * mm, 4 * mm, 1.5 * mm, fill=1, stroke=0)
    c.setFillColor(BADGE_GOLD)
    c.setFont("Helvetica-Bold", 6)
    c.drawCentredString(MARGIN_LEFT + 70 * mm, ty(qr_top + 8), "VERIFIED LINK")

    c.setFillColor(TABLE_SLATE)
    c.setFont("Helvetica", 7.5)
    c.drawString(MARGIN_LEFT + 25 * mm, ty(qr_top + 13),
                 "Scan QR code to verify document authenticity online")
    c.drawString(MARGIN_LEFT + 25 * mm, ty(qr_top + 17), verify_url[:80])

    # ---------- Signature area ----------
    sig_area_top = qr_bottom + 12
    sig_line_y = sig_area_top + 16
    sig_label_y = sig_line_y + 4

    sig_registrar_img = signature_registrar_path()
    sig_dean_img = signature_dean_path()
    stamp_img = stamp_path()

    box_width = 50 * mm
    box_gap = (CONTENT_W - 3 * box_width) / 2
    box_x = [
        MARGIN_LEFT,
        MARGIN_LEFT + box_width + box_gap,
        MARGIN_LEFT + 2 * (box_width + box_gap),
    ]

    boxes = [
        (box_x[0], "University Registrar", sig_registrar_img, 12 * mm),
        (box_x[1], "OFFICIAL STAMP", stamp_img, 44 * mm),
        (box_x[2], "Faculty Dean", sig_dean_img, 12 * mm),
    ]

    for x_pos, label, img, img_sz in boxes:
        if img:
            try:
                # Preserve aspect ratio: use img_sz as the target WIDTH,
                # compute height from the image's natural ratio.
                iw, ih = img.getSize()
                draw_w = img_sz
                draw_h = draw_w * (ih / iw)

                # The PNG has ~18% internal bottom whitespace.
                # Shift the draw anchor down so the VISIBLE content
                # (not the transparent padding) touches the line.
                # For Signature.png: bottom padding is 17.9% of image height.
                bottom_padding_frac = 0.18
                anchor_y_mm = sig_line_y + (draw_h / mm) * bottom_padding_frac

                img_x = x_pos + (box_width - draw_w) / 2

                c.drawImage(img, img_x, ty(anchor_y_mm),
                            width=draw_w, height=draw_h, mask='auto')
            except Exception:
                pass

        c.setStrokeColor(TEXT_BLACK)
        c.setLineWidth(0.4)
        c.line(x_pos, ty(sig_line_y), x_pos + box_width, ty(sig_line_y))

        c.setFillColor(TEXT_BLACK)
        c.setFont("Helvetica", 7.5)
        c.drawCentredString(x_pos + box_width / 2, ty(sig_label_y), label)

    # ---------- Hash code ----------
    hash_y = sig_label_y + 8
    c.setFillColor(MUTED)
    c.setFont("Courier", 7)
    c.drawCentredString(PAGE_W / 2, ty(hash_y),
                        f"Verify at: {verify_url} | Serial: {serial}")

    # ---------- Footer ----------
    draw_standard_footer(c)

    c.showPage()
