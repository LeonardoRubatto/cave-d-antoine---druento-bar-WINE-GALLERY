"""Prepara le foto bottiglia ufficiali (packshot) dei produttori.

Uso:  python scripts/bottles.py
Legge  src/bottiglie-originali/*  (scaricati dalle pagine indicate in
       research/product-image-manifest.json; byte originali conservati)
Scrive assets/images/bottiglie/<id>-<altezza>.avif|.webp  (altezze 400/800/1200)
       data/bottles.json  (dimensioni, lette da scripts/build.mjs)

Trattamento, identico per tutte: ritaglio dei margini trasparenti; per i due
file su fondo bianco (Braida, Saracco) il bianco collegato ai bordi diventa
trasparente; per Lapierre si isola la bottiglia di sinistra di una foto di
gruppo. Nessun ritocco dell'etichetta o della bottiglia.
Strumento di authoring: il sito pubblicato non esegue Python.
"""
import json
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "bottiglie-originali"
OUT = ROOT / "assets" / "images" / "bottiglie"
HEIGHTS = (400, 800, 1200)

# id del vino -> (file originale, trattamento)
SOURCES = {
    "produttori-del-barbaresco-barbaresco": ("barbaresco.png", None),
    "vajra-barolo-albe": ("albe.png", None),
    "braida-montebruna": ("braida-cover.jpg", "white"),
    "saracco-moscato-d-asti": ("moscato.jpg", "white"),
    "produttori-carema-carema": ("carema.png", None),
    "balbiano-freisa-surpreisa": ("surpreisa.png", None),
    "guigal-cotes-du-rhone-rouge": ("guigal.png", None),
    "lapierre-morgon": ("morgon.png", "first-bottle"),
    "fevre-chablis-champs-royaux": ("fevre.png", None),
}


def white_to_alpha(image, threshold=236):
    """Rende trasparente solo il bianco raggiungibile dai bordi (flood fill)."""
    image = image.convert("RGBA")
    w, h = image.size
    px = image.load()
    seen = bytearray(w * h)
    queue = deque()
    for x in range(w):
        queue.extend(((x, 0), (x, h - 1)))
    for y in range(h):
        queue.extend(((0, y), (w - 1, y)))
    while queue:
        x, y = queue.popleft()
        i = y * w + x
        if seen[i]:
            continue
        seen[i] = 1
        r, g, b, _ = px[x, y]
        if min(r, g, b) < threshold:
            continue
        px[x, y] = (r, g, b, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx]:
                queue.append((nx, ny))
    return image


def first_bottle(image):
    """Isola la prima bottiglia da sinistra in una foto di gruppo scontornata."""
    image = image.convert("RGBA")
    w, h = image.size
    alpha = image.getchannel("A")
    body = alpha.crop((0, 0, w, int(h * 0.62))).load()  # sopra il riflesso a terra
    columns = [any(body[x, y] > 200 for y in range(0, int(h * 0.62), 4)) for x in range(w)]
    start = columns.index(True)
    end = start
    while end < w and columns[end]:
        end += 1
    return image.crop((max(0, start - 4), 0, min(w, end + 4), h))


OUT.mkdir(parents=True, exist_ok=True)
for old in OUT.glob("*"):
    old.unlink()
index = {}
for wine_id, (file, treatment) in SOURCES.items():
    with Image.open(SRC / file) as original:
        image = original.convert("RGBA")
    if treatment == "white":
        image = white_to_alpha(image)
    elif treatment == "first-bottle":
        image = first_bottle(image)
    # Ritaglio sui pixel quasi opachi: esclude aloni e riflessi a terra.
    solid = image.getchannel("A").point(lambda a: 255 if a > 180 else 0)
    image = image.crop(solid.getbbox())
    if treatment in ("white", "first-bottle"):
        # Queste foto hanno un riflesso chiaro sotto la bottiglia: si taglia
        # all'ultima riga che contiene ancora vetro (pixel opachi non bianchi).
        px = image.load()
        w, h = image.size
        bottom = h
        for y in range(h - 1, 0, -1):
            glass = sum(1 for x in range(0, w, 2) if px[x, y][3] > 200 and sum(px[x, y][:3]) < 560)
            if glass > w * 0.12:
                bottom = y + 1
                break
        image = image.crop((0, 0, w, bottom))
    ratio = image.width / image.height
    variants = []
    for height in HEIGHTS:
        if height > image.height * 1.05:
            continue
        width = max(1, round(height * ratio))
        resized = image.resize((width, height), Image.Resampling.LANCZOS)
        resized.save(OUT / f"{wine_id}-{height}.webp", "WEBP", quality=82, method=6)
        resized.save(OUT / f"{wine_id}-{height}.avif", "AVIF", quality=60, speed=4)
        variants.append({"height": height, "width": width})
    if not variants:
        height = image.height
        image.save(OUT / f"{wine_id}-{height}.webp", "WEBP", quality=82, method=6)
        image.save(OUT / f"{wine_id}-{height}.avif", "AVIF", quality=60, speed=4)
        variants.append({"height": height, "width": image.width})
    index[wine_id] = {"variants": variants, "ratio": round(ratio, 4)}
    print(wine_id, [v["height"] for v in variants], f"{image.width}x{image.height}")

(ROOT / "data" / "bottles.json").write_text(json.dumps(index, indent=2) + "\n", encoding="utf-8")
