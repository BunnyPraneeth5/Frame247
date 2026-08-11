"""
Generates the test images used by tests/e2e.mjs.

    pip install pillow pillow-heif
    python tests/make-fixtures.py

Produces brand/raw/test-images/: landscape.jpg, portrait.jpg, square.jpg,
photo.heic (real HEIC, for the iPhone conversion path), notes.txt
(unsupported type) and huge.jpg (>25MB, size-limit path).
"""

import os
from PIL import Image, ImageDraw

OUT = os.path.join("brand", "raw", "test-images")
os.makedirs(OUT, exist_ok=True)


def make(name, w, h):
    """Quadrant grid + centre crosshair + corner rings, so any mis-crop or
    aspect distortion is immediately visible in a screenshot."""
    img = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(img)
    cw, ch = w // 2, h // 2
    d.rectangle([0, 0, cw, ch], fill=(230, 60, 60))
    d.rectangle([cw, 0, w, ch], fill=(60, 140, 230))
    d.rectangle([0, ch, cw, h], fill=(60, 200, 100))
    d.rectangle([cw, ch, w, h], fill=(230, 200, 40))
    d.line([w // 2 - 30, h // 2, w // 2 + 30, h // 2], fill=(255, 255, 255), width=4)
    d.line([w // 2, h // 2 - 30, w // 2, h // 2 + 30], fill=(255, 255, 255), width=4)
    for x, y in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        d.ellipse([x - 15, y - 15, x + 15, y + 15], outline=(0, 0, 0), width=5)
    img.save(os.path.join(OUT, name))


make("landscape.jpg", 1600, 900)
make("portrait.jpg", 900, 1600)
make("square.jpg", 1200, 1200)

with open(os.path.join(OUT, "notes.txt"), "w") as f:
    f.write("not an image")

with open(os.path.join(OUT, "huge.jpg"), "wb") as f:
    f.write(b"\x00" * (26 * 1024 * 1024))

try:
    import pillow_heif

    pillow_heif.register_heif_opener()
    Image.open(os.path.join(OUT, "portrait.jpg")).save(
        os.path.join(OUT, "photo.heic"), format="HEIF"
    )
except ImportError:
    print("pillow-heif not installed — skipping photo.heic (HEIC test will fail)")

print("fixtures written to", OUT)
