#!/usr/bin/env python3
"""
Simple image rotator - rotates an image 90 degrees clockwise.

Usage:
    python3 tools/rotate_image.py <image_path>

Examples:
    python3 tools/rotate_image.py site/img_running/2025-12-07/IMG_0057.jpg

Each call rotates the image 90° clockwise (right).
Call multiple times for additional rotation.
"""

import os
import sys
from PIL import Image


def rotate_image(image_path: str) -> None:
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")

    with Image.open(image_path) as img:
        # Rotate 90 degrees clockwise (right)
        rotated = img.rotate(-90, expand=True)
        
        # Determine format from extension
        ext = os.path.splitext(image_path)[1].lower()
        if ext in (".jpg", ".jpeg"):
            rotated.save(image_path, "JPEG", quality=95)
        elif ext == ".png":
            rotated.save(image_path, "PNG", optimize=True)
        else:
            rotated.save(image_path, quality=95)
        
        print(f"✓ Rotated 90° right: {image_path}")


def main():
    if len(sys.argv) < 2 or sys.argv[1] in {"-h", "--help", "help"}:
        print(__doc__)
        sys.exit(1)

    image_path = sys.argv[1]
    rotate_image(image_path)


if __name__ == "__main__":
    main()
