#!/usr/bin/env python3
"""
BD Buddy - Grade Report PDF Generator (ReportLab)
Reads JSON from stdin, writes A4 PDF to stdout.
Matches the HTML grade-report layout.
"""

import sys
import os
import json
import io
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.lib.utils import ImageReader

import qrcode
import barcode
from barcode.writer import ImageWriter


# ============================================================
# CONSTANTS
# ============================================================
PAGE_W, PAGE_H = A4
MARGIN = 10 * mm
CONTENT_W = PAGE_W - 2 * MARGIN

# Brand colors
VIOLET = colors.HexColor("#6D28D9")      # BD Buddy brand
GOLD = colors.HexColor("#FCD34D")        # BD Buddy icon stroke
BLUE = colors.HexColor("#1a5f9c")        # BDU brand
DARK_SLATE = colors.HexColor("#1e293b")  # Semester band
TABLE_SLATE = colors.HexColor("#334155") # Table header
BORDER_LIGHT = colors.HexColor("#e2e8f0")
BORDER_GRAY = colors.HexColor("#cbd5e1")
MUTED = colors.HexColor("#64748b")
MUTED_LIGHT = colors.HexColor("#94a3b8")
FOOTER_GRAY = colors.HexColor("#475569")
TEXT_BLACK = colors.HexColor("#000000")
SUCCESS = colors.HexColor("#065f46")
SUCCESS_BG = colors.HexColor("#d1fae5")
NAVY = colors.HexColor("#0b1e33")
BADGE_GOLD = colors.HexColor("#fbbf24")
BG_LIGHT = colors.HexColor("#fafafa")


# ============================================================
# BACKGROUND LAYERS
# ============================================================
def draw_backgrounds(c):
    # Guilloche pattern
    c.saveState()
    c.setStrokeColor(BLUE)
    c.setLineWidth(0.3)
    c.setStrokeAlpha(0.035)
    # Horizontal
    for y in range(0, int(PAGE_H), 3):
        c.line(0, y, PAGE_W, y)
    # Diagonals
    for offset in range(-int(PAGE_H), int(PAGE_W) + int(PAGE_H), 25):
        c.line(offset, 0, offset + PAGE_H, PAGE_H)
        c.line(offset, PAGE_H, offset + PAGE_H, 0)
    c.restoreState()

    # Watermark
    c.saveState()
    c.setFont("Helvetica-Bold", 72)
    c.setFillColor(colors.black)
    c.setFillAlpha(0.035)
    c.translate(PAGE_W / 2, PAGE_H / 2)
    c.rotate(-45)
    c.drawCentredString(0, 0, "OFFICIAL VERIFIED")
    c.restoreState()

    # Latent image "BDU" box
    c.saveState()
    c.setStrokeColor(colors.black)
    c.setFillColor(colors.black)
    c.setLineWidth(3)
    c.setStrokeAlpha(0.03)
    c.setFillAlpha(0.03)
    c.translate(PAGE_W - 30 * mm, PAGE_H - 40 * mm)
    c.rotate(15)
    c.rect(-10 * mm, -10 * mm, 20 * mm, 20 * mm, fill=1, stroke=1)
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(0, -3, "BDU")
    c.restoreState()


# ============================================================
# HELPERS: QR + BARCODE
# ============================================================
def make_qr(text):
    qr = qrcode.QRCode(version=4, box_size=10, border=1)
    qr.add_data(text)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return ImageReader(buf)


def make_barcode(text):
    try:
        code = barcode.get('code128', text, writer=ImageWriter())
        buf = io.BytesIO()
        code.write(buf, options={"module_height": 6.0, "font_size": 6, "text_distance": 1, "quiet_zone": 1})
        buf.seek(0)
        return ImageReader(buf)
    except Exception:
        return None


def try_image(path, w, h):
    try:
        img = ImageReader(path)
        return img
    except Exception:
        return None


# ============================================================
# MAIN GENERATOR
# ============================================================
def generate_pdf(data):
    buf = io.BytesIO()
    c = pdfcanvas.Canvas(buf, pagesize=A4)
    c.setTitle("BDU Grade Report - BD Buddy")
    c.setAuthor("BD Buddy")

    bio = data.get("biography", {}) or {}
    reg = data.get("registration", {}) or {}
    courses = data.get("courses", []) or []
    summary = data.get("summary", {}) or {}
    serial = data.get("serial", "BDU-GR-UNKNOWN")
    verify_url = data.get("verifyUrl", "")

    print_date = datetime.now().strftime("%b %d, %Y")

    # ---- Layer 0: backgrounds ----
    draw_backgrounds(c)

    y = PAGE_H - MARGIN

    # ---- 1. Micro-text (4mm) ----
    c.setFont("Helvetica", 4)
    c.setFillColor(MUTED_LIGHT)
    c.drawCentredString(
        PAGE_W / 2, y,
        "BAHIR DAR UNIVERSITY OFFICIAL ACADEMIC DOCUMENT - TAMPER PROOF SECURITY FEATURE - BAHIR DAR UNIVERSITY"
    )
    y -= 4 * mm

    # ---- 2. Serial (3mm) ----
    c.setFont("Courier-Bold", 8.5)
    c.setFillColor(TABLE_SLATE)
    c.drawRightString(PAGE_W - MARGIN, y, f"Serial: {serial}")
    y -= 3 * mm

    # ---- 3. Header row (13mm): BD Buddy | logo | date ----
    # BD Buddy left
    c.setFillColor(VIOLET)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(MARGIN, y, "BD Buddy")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6)
    c.drawString(MARGIN, y - 3 * mm, "Unofficial BDU Portal Viewer")

    # Logo center
    logo_path = os.path.join(os.path.dirname(__file__), "..", "public", "images", "logo.png")
    try:
        logo = ImageReader(logo_path)
        logo_size = 12 * mm
        c.drawImage(logo, PAGE_W / 2 - logo_size / 2, y - 9 * mm,
                    width=logo_size, height=logo_size, mask='auto')
    except Exception:
        pass

    # Print date right
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6)
    c.drawRightString(PAGE_W - MARGIN, y, "PRINT DATE")
    c.setFillColor(BLUE)
    c.setFont("Helvetica-Bold", 9)
    c.drawRightString(PAGE_W - MARGIN, y - 3 * mm, print_date)

    y -= 13 * mm

    # ---- 4. Divider ----
    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(0.6)
    c.line(MARGIN, y, PAGE_W - MARGIN, y)
    y -= 5 * mm

    # ---- 5. University name (5mm) ----
    c.setFillColor(TEXT_BLACK)
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(PAGE_W / 2, y, "BAHIR DAR UNIVERSITY")
    y -= 5 * mm

    # ---- 6. Report title (7mm) ----
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(TEXT_BLACK)
    c.drawCentredString(PAGE_W / 2, y, "SEMESTER GRADE REPORT")

    # SECURE badge
    badge_w, badge_h = 24 * mm, 4 * mm
    badge_x = PAGE_W / 2 + 30 * mm
    c.setFillColor(SUCCESS_BG)
    c.roundRect(badge_x, y - 1 * mm, badge_w, badge_h, 1.5 * mm, fill=1, stroke=0)
    c.setFillColor(SUCCESS)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(badge_x + 5 * mm, y, "SECURE")

    y -= 7 * mm

    # ---- 7. Student info (22mm, 4 rows) ----
    left_col = MARGIN
    right_col = PAGE_W / 2 + 3 * mm
    row_h = 5.5 * mm

    info_rows = [
        ("Student:", bio.get("fullName", "-"), "Student ID:", bio.get("studentId", "-")),
        ("Program:", reg.get("program", "-"), "Academic Year:", reg.get("acYear", "-")),
        ("Semester:", reg.get("semester", "-"), "Total Credits:", str(summary.get("totalCredits", "-"))),
        ("Cumulative GPA:", str(summary.get("cumulativeGPA", "-")), "Status:", reg.get("status", "-")),
    ]

    for lbl_l, val_l, lbl_r, val_r in info_rows:
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(TEXT_BLACK)
        c.drawString(left_col, y, lbl_l)
        c.drawString(right_col, y, lbl_r)

        c.setFont("Helvetica", 10)
        c.drawString(left_col + 26 * mm, y, str(val_l))
        c.drawString(right_col + 26 * mm, y, str(val_r))
        y -= row_h

    y -= 2 * mm

    # ---- 8. Semester band (8mm) ----
    sem_label = f"Semester {reg.get('semester', '-')} ({reg.get('acYear', '-')})"
    c.setFillColor(DARK_SLATE)
    c.rect(MARGIN, y - 5 * mm, CONTENT_W, 6 * mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN + 3 * mm, y - 3.5 * mm, sem_label)
    y -= 8 * mm

    # ---- 9. Course table header (6mm) ----
    col_x = [
        MARGIN + 2 * mm,    # Code
        MARGIN + 22 * mm,   # Title
        MARGIN + 95 * mm,   # Cr
        MARGIN + 112 * mm,  # Gr
        MARGIN + 130 * mm,  # Pts
        MARGIN + 150 * mm,  # %
    ]
    col_headers = ["Code", "Course Title", "Cr", "Gr", "Pts", "%"]

    c.setFillColor(TABLE_SLATE)
    c.rect(MARGIN, y - 4 * mm, CONTENT_W, 5 * mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 8)
    for x, h in zip(col_x, col_headers):
        c.drawString(x, y - 3 * mm, h)
    y -= 6 * mm

    # ---- 10. Course rows (5mm each) ----
    c.setFillColor(TEXT_BLACK)
    for course in courses:
        if y < MARGIN + 130 * mm:  # protect footer zones
            break
        c.setFont("Helvetica", 8.5)
        c.drawString(col_x[0], y, str(course.get("code", ""))[:12])
        c.drawString(col_x[1], y, str(course.get("title", ""))[:42])
        c.drawString(col_x[2], y, str(course.get("credit", "")))
        c.setFont("Helvetica-Bold", 8.5)
        c.drawString(col_x[3], y, str(course.get("grade", "")))
        c.setFont("Helvetica", 8.5)
        c.drawString(col_x[4], y, str(course.get("points", "0")))
        pct = course.get("percentage", "")
        c.drawString(col_x[5], y, f"{pct}%" if pct else "-")
        y -= 5 * mm

    y += 1 * mm
    c.setStrokeColor(BORDER_LIGHT)
    c.setLineWidth(0.4)
    c.line(MARGIN, y, PAGE_W - MARGIN, y)
    y -= 5 * mm

    # ---- 11. SGPA / CGPA summary (10mm) ----
    c.setFillColor(TEXT_BLACK)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN, y, f"SGPA: {summary.get('sgpa', '-')}")
    c.drawString(MARGIN + 45 * mm, y, f"CGPA: {summary.get('cumulativeGPA', '-')}")
    c.drawRightString(PAGE_W - MARGIN, y, f"Status: {reg.get('status', 'Pass')}")
    y -= 10 * mm

    # ---- 12. Barcode + hologram (16mm) ----
    bar_h = 12 * mm
    c.setFillColor(BG_LIGHT)
    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(0.4)
    c.rect(MARGIN, y - bar_h - 2 * mm, CONTENT_W, bar_h + 4 * mm, fill=1, stroke=1)

    barcode_reader = make_barcode(serial)
    if barcode_reader:
        c.drawImage(barcode_reader, MARGIN + 5 * mm, y - bar_h,
                    width=80 * mm, height=bar_h, mask='auto')

    # Hologram circle
    holo_x = PAGE_W - MARGIN - 18 * mm
    holo_y = y - bar_h / 2 - 2 * mm
    holo_r = 6 * mm
    c.setFillColor(GOLD)
    c.circle(holo_x, holo_y, holo_r, fill=1, stroke=0)
    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(0.6)
    c.circle(holo_x, holo_y, holo_r, fill=0, stroke=1)
    c.setFillColor(DARK_SLATE)
    c.setFont("Helvetica-Bold", 6)
    c.drawCentredString(holo_x, holo_y - 2, "BDU")

    y -= bar_h + 6 * mm

    # ---- 13. QR section (24mm) ----
    qr_size = 18 * mm
    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(0.4)
    c.setDash(2, 2)
    c.rect(MARGIN, y - qr_size - 2 * mm, CONTENT_W, qr_size + 4 * mm, fill=0, stroke=1)
    c.setDash()

    if verify_url:
        qr_reader = make_qr(verify_url)
        c.drawImage(qr_reader, MARGIN + 3 * mm, y - qr_size,
                    width=qr_size, height=qr_size, mask='auto')

    c.setFillColor(TEXT_BLACK)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(MARGIN + 25 * mm, y - 3 * mm, "VERIFICATION QR")

    # Encrypted badge
    enc_x = MARGIN + 55 * mm
    c.setFillColor(NAVY)
    c.roundRect(enc_x, y - 4.5 * mm, 30 * mm, 4 * mm, 1.5 * mm, fill=1, stroke=0)
    c.setFillColor(BADGE_GOLD)
    c.setFont("Helvetica-Bold", 6)
    c.drawString(enc_x + 2 * mm, y - 3.3 * mm, "VERIFIED LINK")

    c.setFillColor(TABLE_SLATE)
    c.setFont("Helvetica", 7.5)
    c.drawString(MARGIN + 25 * mm, y - 9 * mm, "Scan QR code to verify document authenticity online")
    if verify_url:
        c.drawString(MARGIN + 25 * mm, y - 13 * mm, verify_url[:80])

    y -= qr_size + 6 * mm

    # ---- 14. Signature area (30mm) ----
    sig_w = 50 * mm
    sig_y = y - 15 * mm

    positions = [
        (MARGIN, "University Registrar", os.path.join(os.path.dirname(__file__), "..", "public", "images", "Signature.png"), 12 * mm),
        (PAGE_W / 2 - sig_w / 2, "OFFICIAL STAMP", os.path.join(os.path.dirname(__file__), "..", "public", "images", "stamp.jpg"), 15 * mm),
        (PAGE_W - MARGIN - sig_w, "Faculty Dean", os.path.join(os.path.dirname(__file__), "..", "public", "images", "Signature.png"), 12 * mm),
    ]

    for x_pos, label, img_path, img_size in positions:
        try:
            img = ImageReader(img_path)
            c.drawImage(img, x_pos + sig_w / 2 - img_size / 2, sig_y + 2 * mm,
                        width=img_size, height=img_size, mask='auto', preserveAspectRatio=True)
        except Exception:
            pass

        c.setStrokeColor(TEXT_BLACK)
        c.setLineWidth(0.4)
        c.line(x_pos, sig_y, x_pos + sig_w, sig_y)
        c.setFillColor(TEXT_BLACK)
        c.setFont("Helvetica", 7.5)
        c.drawCentredString(x_pos + sig_w / 2, sig_y - 3.5 * mm, label)

    y -= 30 * mm

    # ---- 15. Hash code (5mm) ----
    c.setFont("Courier", 7)
    c.setFillColor(MUTED)
    hash_line = f"Verify at: {verify_url} | Serial: {serial}"
    c.drawCentredString(PAGE_W / 2, y, hash_line[:110])
    y -= 5 * mm

    # ---- 16. Footer (8mm) ----
    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(0.4)
    c.line(MARGIN, y, PAGE_W - MARGIN, y)
    c.setFont("Helvetica", 8)
    c.setFillColor(FOOTER_GRAY)
    c.drawCentredString(
        PAGE_W / 2, y - 4 * mm,
        "Official Academic Document Issued By Bahir Dar University - Valid Without Manual Alterations"
    )

    c.showPage()
    c.save()
    return buf.getvalue()


# ============================================================
# ENTRY
# ============================================================
def main():
    try:
        raw = sys.stdin.read()
        data = json.loads(raw)
        pdf_bytes = generate_pdf(data)
        sys.stdout.buffer.write(pdf_bytes)
        sys.stdout.buffer.flush()
    except Exception as e:
        sys.stderr.write(f"PDF generation failed: {e}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
