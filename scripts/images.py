"""Genera le varianti responsive delle foto d'atmosfera (rules/images.md).

Uso:  python scripts/images.py
Legge  src/photos/<nome>.jpg  (originali Unsplash, vedi research/free-photo-manifest.json)
Scrive assets/images/foto/<nome>-<larghezza>.avif|.webp  per 640/960/1536 px
       data/images.json  (dimensioni intrinseche, lette da scripts/build.mjs)

Strumento di authoring: il sito pubblicato non esegue Python.
Richiede Pillow >= 11 (supporto AVIF nativo). Nessun ritocco: solo
ridimensionamento e ricompressione.
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "photos"
OUT = ROOT / "assets" / "images" / "foto"
WIDTHS = (640, 960, 1536)

OUT.mkdir(parents=True, exist_ok=True)
for old in OUT.glob("*"):  # niente varianti orfane (rules/images.md)
    old.unlink()
index = {}

for source in sorted(SRC.glob("*.jpg")):
    name = source.stem
    with Image.open(source) as original:
        original = original.convert("RGB")
        ratio = original.height / original.width
        written = []
        for width in WIDTHS:
            if width > original.width:
                continue
            height = round(width * ratio)
            resized = original.resize((width, height), Image.Resampling.LANCZOS)
            resized.save(OUT / f"{name}-{width}.webp", "WEBP", quality=74, method=6)
            resized.save(OUT / f"{name}-{width}.avif", "AVIF", quality=52, speed=4)
            written.append(width)
        index[name] = {
            "widths": written,
            "width": written[-1],
            "height": round(written[-1] * ratio),
        }
    print(f"{name}: {written}")

(ROOT / "data" / "images.json").write_text(json.dumps(index, indent=2) + "\n", encoding="utf-8")
