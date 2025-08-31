#!/usr/bin/env python3
"""
Generic image resizer for web use (frontpage banner, etc.).

Usage:
  python3 tools/resize_image.py <input_path> <output_path> [--max-width N] [--max-height N] [--quality Q]

Defaults:
    --max-width 1600
    --max-height 1000
    --quality 85

Features:
    - Preserves aspect ratio (no stretching)
    - Auto-orients using EXIF
    - Strips metadata
    - Optimized/progressive JPEG output
"""

import os
import sys
from typing import Tuple

from PIL import Image, ImageOps


def parse_args(argv: list) -> Tuple[str, str, int, int, int]:
    if len(argv) < 3 or argv[1] in {"-h", "--help", "help"}:
        print(__doc__)
        sys.exit(1)

    input_path = argv[1]
    output_path = argv[2]
    max_w = 1600
    max_h = 1000
    quality = 85

    # simple flag parser
    i = 3
    while i < len(argv):
        if argv[i] == "--max-width" and i + 1 < len(argv):
            max_w = int(argv[i + 1])
            i += 2
        elif argv[i] == "--max-height" and i + 1 < len(argv):
            max_h = int(argv[i + 1])
            i += 2
        elif argv[i] == "--quality" and i + 1 < len(argv):
            quality = int(argv[i + 1])
            i += 2
        else:
            print(f"Unknown argument: {argv[i]}")
            sys.exit(2)

    return input_path, output_path, max_w, max_h, quality


def resize_image(input_path: str, output_path: str, max_w: int, max_h: int, quality: int) -> None:
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input not found: {input_path}")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with Image.open(input_path) as im:
        # Auto-orient image by EXIF
        im = ImageOps.exif_transpose(im)

        # Convert to RGB if needed (e.g., for PNG/HEIC with alpha)
        if im.mode not in ("RGB", "L"):
            im = im.convert("RGB")

        w, h = im.size
        # Compute scaling to fit within bounds preserving aspect ratio
        scale = min(max_w / w, max_h / h, 1.0)
        new_size = (int(w * scale), int(h * scale))
        if new_size != (w, h):
            im = im.resize(new_size, Image.Resampling.LANCZOS)

        # Save JPEG by extension; if output is PNG keep png (but default to JPEG benefits)
        ext = os.path.splitext(output_path)[1].lower()
        if ext in (".jpg", ".jpeg"):
            im.save(
                output_path,
                "JPEG",
                quality=quality,
                optimize=True,
                progressive=True,
            )
        elif ext == ".png":
            im.save(output_path, "PNG", optimize=True)
        else:
            # default to JPEG if unknown
            output_path = os.path.splitext(output_path)[0] + ".jpg"
            im.save(
                output_path,
                "JPEG",
                quality=quality,
                optimize=True,
                progressive=True,
            )
        print(f"Saved: {output_path}")


def main():
    inp, outp, max_w, max_h, quality = parse_args(sys.argv)
    print("Image Resize")
    print("=" * 40)
    print(f"Input:  {inp}")
    print(f"Output: {outp}")
    print(f"Bounds: {max_w}x{max_h}")
    print(f"Quality: {quality}")
    resize_image(inp, outp, max_w, max_h, quality)


if __name__ == "__main__":
    main()
