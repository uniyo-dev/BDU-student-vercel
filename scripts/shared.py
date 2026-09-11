"""
BD Buddy — Shared constants, colors, and helpers for the PDF generator.
"""

import os
import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader

import qrcode
import barcode
from barcode.writer import ImageWriter


# ============================================================
# PAGE GEOMETRY
# ============================================================
PAGE_W, PAGE_H = A4
MARGIN_LEFT = 10 * mm
MARGIN_RIGHT = PAGE_W - 10 * mm
CONTENT_W = 190 * mm


# ============================================================
# BRAND PALETTE
# ============================================================
BRAND_VIOLET = colors.HexColor("#6D28D9")
BDU_BLUE = colors.HexColor("#1a5f9c")
DARK_SLATE = colors.HexColor("#1e293b")
TABLE_SLATE = colors.HexColor("#334155")
BORDER_LIGHT = colors.HexColor("#e2e8f0")
BORDER_GRAY = colors.HexColor("#cbd5e1")
MUTED = colors.HexColor("#64748b")
MUTED_LIGHT = colors.HexColor("#94a3b8")
FOOTER_GRAY = colors.HexColor("#475569")
TEXT_BLACK = colors.HexColor("#000000")
SUCCESS = colors.HexColor("#065f46")
SUCCESS_BG = colors.HexColor("#d1fae5")
NAVY_BG = colors.HexColor("#0b1e33")
BADGE_GOLD = colors.HexColor("#fbbf24")
HOLOGRAM_GOLD = colors.HexColor("#FFD700")
BG_LIGHT = colors.HexColor("#fafafa")
DISCLAIMER_BG = colors.HexColor("#fef2f2")
DISCLAIMER_BORDER = colors.HexColor("#fca5a5")
DISCLAIMER_TITLE = colors.HexColor("#991b1b")
DISCLAIMER_BODY = colors.HexColor("#7f1d1d")


# ============================================================
# Y COORDINATE HELPER (top-down mm → bottom-up points)
# ============================================================
def ty(user_y_mm):
    return (297 - user_y_mm) * mm


# ============================================================
# ASSET LOADING
# ============================================================
def find_asset(*rel_paths):
    """Try multiple relative paths; return ImageReader for the first that exists."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    for rel_path in rel_paths:
        full_path = os.path.normpath(os.path.join(base_dir, rel_path))
        if os.path.exists(full_path):
            try:
                return ImageReader(full_path)
            except Exception:
                continue
    return None


def logo_path():
    return find_asset(
        os.path.join("..", "public", "images", "logo.png"),
        os.path.join("..", "public", "images", "logo.jpg"),
        os.path.join("public", "images", "logo.png"),
        os.path.join("public", "images", "logo.jpg"),
    )


def signature_registrar_path():
    return find_asset(
        os.path.join("..", "public", "images", "signature-registrar.png"),
        os.path.join("..", "public", "images", "Signature.png"),
        os.path.join("public", "images", "signature-registrar.png"),
        os.path.join("public", "images", "Signature.png"),
    )


def signature_dean_path():
    return find_asset(
        os.path.join("..", "public", "images", "Signature-dean.png"),
        os.path.join("..", "public", "images", "signature-dean.png"),
        os.path.join("public", "images", "Signature-dean.png"),
        os.path.join("public", "images", "signature-dean.png"),
    )


def stamp_path():
    return find_asset(
        os.path.join("..", "public", "images", "stamp-official.jpg"),
        os.path.join("..", "public", "images", "stamp.jpg"),
        os.path.join("public", "images", "stamp-official.jpg"),
        os.path.join("public", "images", "stamp.jpg"),
    )


# ============================================================
# QR CODE
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


# ============================================================
# BARCODE
# ============================================================
def make_barcode(text):
    try:
        code = barcode.get('code128', text, writer=ImageWriter())
        buf = io.BytesIO()
        code.write(buf, options={
            "module_height": 6.0,
            "font_size": 6,
            "text_distance": 1,
            "quiet_zone": 1,
            "write_text": False,
        })
        buf.seek(0)
        return ImageReader(buf)
    except Exception:
        return None


# ============================================================
# BACKGROUND SECURITY LAYERS
# ============================================================
def draw_security_layers(c, watermark_text="OFFICIAL VERIFIED"):
    # Layer 1: Guilloche pattern
    c.saveState()
    c.setStrokeColor(BDU_BLUE)
    c.setLineWidth(0.3)
    c.setStrokeAlpha(0.035)
    for y in range(0, int(PAGE_H), 3):
        c.line(0, y, PAGE_W, y)
    for offset in range(-int(PAGE_H), int(PAGE_W) + int(PAGE_H), 25):
        c.line(offset, 0, offset + PAGE_H, PAGE_H)
        c.line(offset, PAGE_H, offset + PAGE_H, 0)
    c.restoreState()

    # Layer 2: Watermark
    c.saveState()
    c.setFont("Helvetica-Bold", 72)
    c.setFillColor(TEXT_BLACK)
    c.setFillAlpha(0.035)
    c.translate(PAGE_W / 2, PAGE_H / 2)
    c.rotate(-45)
    c.drawCentredString(0, 0, watermark_text)
    c.restoreState()

    # Layer 3: Latent "BDU" box
    c.saveState()
    c.setStrokeColor(TEXT_BLACK)
    c.setFillColor(TEXT_BLACK)
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
# COMMON FOOTER
# ============================================================
def draw_standard_footer(c):
    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(0.4)
    c.line(MARGIN_LEFT, ty(282), MARGIN_RIGHT, ty(282))

    c.setFont("Helvetica", 8)
    c.setFillColor(FOOTER_GRAY)
    c.drawCentredString(PAGE_W / 2, ty(287),
        "Official Academic Document Issued By Bahir Dar University —")
    c.drawCentredString(PAGE_W / 2, ty(291),
        "Valid Without Manual Alterations")


# ============================================================
# COMMON HEADER (all pages)
# ============================================================
def draw_common_header(c, serial, print_date):
    # Micro-text line
    c.setFont("Helvetica", 4)
    c.setFillColor(MUTED_LIGHT)
    c.drawCentredString(PAGE_W / 2, ty(10),
        "BAHIR DAR UNIVERSITY OFFICIAL ACADEMIC DOCUMENT — "
        "TAMPER PROOF SECURITY FEATURE — BAHIR DAR UNIVERSITY")

    # Serial number
    c.setFont("Courier-Bold", 8.5)
    c.setFillColor(TABLE_SLATE)
    c.drawRightString(MARGIN_RIGHT, ty(14), f"Serial: {serial}")

    # LEFT: BD Buddy brand logo (badge + wordmark)
    draw_bd_buddy_logo(c, x_mm=MARGIN_LEFT / mm, y_mm=17, scale=0.55)

    # CENTER: BDU Logo
    logo = logo_path()
    if logo:
        c.drawImage(logo, PAGE_W / 2 - 6 * mm, ty(29),
                    width=12 * mm, height=12 * mm, mask='auto')

    # RIGHT: Print Date
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6)
    c.drawRightString(MARGIN_RIGHT, ty(20), "PRINT DATE")
    c.setFillColor(BDU_BLUE)
    c.setFont("Helvetica-Bold", 9)
    c.drawRightString(MARGIN_RIGHT, ty(23.5), print_date)

    # Divider
    c.setStrokeColor(BORDER_GRAY)
    c.setLineWidth(0.6)
    c.line(MARGIN_LEFT, ty(31), MARGIN_RIGHT, ty(31))


# ============================================================
# BD BUDDY BRAND LOGO (drawn natively — no image needed)
# ============================================================
def draw_bd_buddy_logo(c, x_mm, y_mm, scale=1.0):
    """
    Draw the BD Buddy badge + wordmark at (x_mm, y_mm) top-down coordinates.
    scale=1.0 → badge ~12mm, wordmark ~14pt
    Returns the total width consumed (mm).
    """
    from reportlab.lib.colors import HexColor

    # Colors
    violet_light = HexColor("#8B5CF6")
    violet_dark = HexColor("#4C1D95")
    gold = HexColor("#FCD34D")
    violet_text = HexColor("#6D28D9")
    muted_text = HexColor("#64748b")

    # Geometry in mm
    badge_size = 12 * scale
    gap = 3 * scale
    text_x_offset = badge_size + gap

    # Save graphics state
    c.saveState()

    # --- Badge background (rounded rect with violet gradient) ---
    # ReportLab doesn't support gradients natively on paths easily.
    # We'll use solid violet and layer a lighter strip for subtle effect.
    c.setFillColor(violet_dark)
    c.roundRect(
        x_mm * mm,
        ty(y_mm + badge_size),
        badge_size * mm,
        badge_size * mm,
        radius=2.5 * mm,
        fill=1, stroke=0
    )

    # Lighter overlay (top-left corner glow effect)
    c.setFillColor(violet_light)
    c.setFillAlpha(0.45)
    c.roundRect(
        x_mm * mm,
        ty(y_mm + badge_size * 0.55),
        badge_size * mm,
        badge_size * 0.55 * mm,
        radius=2.5 * mm,
        fill=1, stroke=0
    )
    c.setFillAlpha(1)

    # Gold inner ring
    ring_inset = 1.2 * scale
    c.setStrokeColor(gold)
    c.setStrokeAlpha(0.55)
    c.setLineWidth(0.5)
    c.roundRect(
        (x_mm + ring_inset) * mm,
        ty(y_mm + badge_size - ring_inset),
        (badge_size - 2 * ring_inset) * mm,
        (badge_size - 2 * ring_inset) * mm,
        radius=1.8 * mm,
        fill=0, stroke=1
    )
    c.setStrokeAlpha(1)

    # --- Graduation cap inside the badge ---
    cx = (x_mm + badge_size / 2) * mm
    cy = ty(y_mm + badge_size / 2)
    cap_scale = badge_size * 0.05   # cap width in mm
    cap_w = cap_scale * mm
    cap_h = cap_scale * 0.7 * mm

    c.setStrokeColor(gold)
    c.setFillColor(gold)
    c.setLineWidth(1.2)
    c.setLineCap(1)
    c.setLineJoin(1)

    # Top trapezoid (mortarboard)
    p = c.beginPath()
    p.moveTo(cx - cap_w, cy)
    p.lineTo(cx, cy + cap_h)
    p.lineTo(cx + cap_w, cy)
    p.lineTo(cx, cy - cap_h)
    p.close()
    c.drawPath(p, stroke=1, fill=0)

    # Bottom cap band
    p2 = c.beginPath()
    p2.moveTo(cx - cap_w * 0.55, cy - cap_h * 0.5)
    p2.lineTo(cx - cap_w * 0.55, cy - cap_h * 1.3)
    p2.curveTo(
        cx - cap_w * 0.55, cy - cap_h * 1.7,
        cx + cap_w * 0.55, cy - cap_h * 1.7,
        cx + cap_w * 0.55, cy - cap_h * 1.3
    )
    p2.lineTo(cx + cap_w * 0.55, cy - cap_h * 0.5)
    c.drawPath(p2, stroke=1, fill=0)

    # Tassel dot
    c.circle(cx + cap_w * 0.85, cy + cap_h * 0.05, 0.5, fill=1, stroke=0)

    # --- Wordmark "BD Buddy" ---
    text_x = (x_mm + text_x_offset) * mm
    text_y_main = ty(y_mm + badge_size * 0.42)

    c.setFillColor(violet_text)
    c.setFont("Helvetica-Bold", 11 * scale)
    c.drawString(text_x, text_y_main, "BD Buddy")

    # --- Tagline ---
    text_y_tag = ty(y_mm + badge_size * 0.85)
    c.setFillColor(muted_text)
    c.setFont("Helvetica", 5.5 * scale)
    c.drawString(text_x, text_y_tag, "Unofficial BDU Portal Viewer")

    c.restoreState()

    # Return total width consumed
    return text_x_offset + 40 * scale

