"""Genera assets/images/og.png (1200x630) e favicon.ico.

Uso:  python scripts/brand-assets.py
Strumento di authoring (Pillow + fontTools con brotli per leggere i woff2).
L'immagine di condivisione è una grafica tipografica: nessuna foto, nessun
vino reale. Colori e caratteri sono i token del marchio (assets/css/style.css).
"""
import io
from pathlib import Path

from fontTools.ttLib import TTFont
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "assets" / "fonts"
IMAGES = ROOT / "assets" / "images"

CELLAR = (24, 11, 12)
IVORY = (246, 243, 234)
MARKER = (228, 199, 128)
MUTED = (201, 177, 177)
WINE = (111, 39, 47)


def font(file, size, weight=None):
    tt = TTFont(FONTS / file)
    tt.flavor = None
    buffer = io.BytesIO()
    tt.save(buffer)
    buffer.seek(0)
    face = ImageFont.truetype(buffer, size)
    if weight is not None:
        try:
            face.set_variation_by_axes([weight])
        except OSError:
            pass
    return face


W, H = 1200, 630

# L'alone della lanterna: evidenziatore del marchio, sfocato, sommato al buio
glow = Image.new("RGB", (W, H), (0, 0, 0))
ImageDraw.Draw(glow).ellipse((620, 60, 1140, 580), fill=(96, 78, 44))
glow = glow.filter(ImageFilter.GaussianBlur(120))
og = ImageChops.add(Image.new("RGB", (W, H), CELLAR), glow)

draw = ImageDraw.Draw(og)

# La volta: l'arco del marchio come cornice
frame = (65, 45, 45)
draw.arc((40, 40, W - 40, 360), start=180, end=360, fill=frame, width=2)
draw.line((40, 200, 40, H - 40), fill=frame, width=2)
draw.line((W - 41, 200, W - 41, H - 40), fill=frame, width=2)
draw.line((40, H - 41, W - 40, H - 41), fill=frame, width=2)

label = font("dm-sans.woff2", 22, 500)
display = font("cormorant-garamond.woff2", 118, 500)
display_italic = font("cormorant-garamond-italic.woff2", 118, 500)
small = font("dm-sans.woff2", 24, 400)

draw.text((96, 188), "LA CAVE D’ANTOINE · DRUENTO", font=label, fill=MARKER)
draw.text((90, 232), "Cantina", font=display, fill=IVORY)
width = draw.textlength("dei ", font=display_italic)
draw.rectangle((92, 420, 92 + width + draw.textlength("vini.", font=display_italic), 452), fill=WINE)
draw.text((90, 340), "dei vini.", font=display_italic, fill=IVORY)
draw.text((96, 500), "Una bottiglia alla volta. Selezione in aggiornamento.", font=small, fill=MUTED)

# Una targa, come nella galleria
plate = (842, 170, 1062, 470)
draw.rectangle(plate, fill=(255, 252, 243))
draw.rectangle((plate[0], plate[1], plate[2], plate[1] + 7), fill=WINE)
draw.rectangle((plate[0] + 7, plate[1] + 14, plate[2] - 7, plate[3] - 7), outline=(205, 191, 168), width=1)
draw.text(((plate[0] + plate[2]) / 2, plate[1] + 48), "ROSSO", font=font("dm-sans.woff2", 14, 500), fill=WINE, anchor="mm")
draw.text(((plate[0] + plate[2]) / 2, plate[1] + 140), "Cave", font=font("cormorant-garamond.woff2", 60, 600), fill=(48, 42, 37), anchor="mm")
draw.text(((plate[0] + plate[2]) / 2, plate[1] + 192), "d’Antoine", font=font("cormorant-garamond-italic.woff2", 34, 500), fill=(110, 103, 95), anchor="mm")
draw.line((plate[0] + 30, plate[1] + 236, plate[2] - 30, plate[1] + 236), fill=(216, 208, 194), width=1)
draw.text(((plate[0] + plate[2]) / 2, plate[1] + 262), "ANNATA DA CONFERMARE", font=font("dm-sans.woff2", 12, 400), fill=(110, 103, 95), anchor="mm")

og.save(IMAGES / "og.png", optimize=True)

# favicon.ico dal PNG 32px già condiviso con il sito generale
icon = Image.open(IMAGES / "favicon-32.png").convert("RGBA")
icon.save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32)])
print("og.png e favicon.ico scritti")
