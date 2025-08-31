# Image Tools

This folder contains small utilities to prepare images for the site.

- HEIC to JPEG converter (date-based, square 600x600 for posts)
- Generic image resizer (JPG/PNG), aspect-fit with compression for banners/frontpage images

## 1) HEIC to JPEG (square 600x600 for posts)

Quick start:

```bash
python3 tools/convert_heic_photos.py <photo_directory> [output_base_directory]
```

Examples:

```bash
# Most common usage - photos will be organized by date automatically
python3 tools/convert_heic_photos.py _temp_photos

# Custom output directory
python3 tools/convert_heic_photos.py _temp_photos img_running

# From any directory
python3 tools/convert_heic_photos.py ~/Desktop/race_photos
```

What it does:

1. Reads HEIC/HEIF files from input directory
2. Extracts date taken from EXIF
3. Creates date directories like `img_running/YYYY-MM-DD/`
4. Center-crops to square and resizes to exactly 600x600 (no stretching)
5. Saves as high-quality JPEG (95%)

Output structure:

```
img_running/
├── 2025-08-16/
│   ├── IMG_7671.jpg
│   ├── IMG_7672.jpg
│   └── ...
├── 2025-08-15/
│   ├── IMG_7650.jpg
│   └── ...
└── ...
```

## 2) Generic Image Resizer (JPG/PNG)

Use this for non-HEIC images (JPG/PNG) or when you need a single web‑friendly image (e.g., frontpage image or banner).

Quick start:

```bash
python3 tools/resize_image.py <input_path> <output_path> [--max-width N] [--max-height N] [--quality Q]
```

Defaults:
- max-width: 1600
- max-height: 1000
- quality: 85

Features:
- Preserves aspect ratio (no stretching)
- Auto-orients via EXIF
- Strips metadata
- Optimized/progressive JPEG output

Examples:

```bash
# Create a web-friendly frontpage image from a JPG/PNG
python3 tools/resize_image.py ./temp/IMG_9626.JPG ./img_running/frontpage.jpg --max-width 1600 --max-height 1000 --quality 85

# Smaller banner variant
python3 tools/resize_image.py ./temp/IMG_9626.JPG ./img_running/frontpage.jpg --max-width 1400 --max-height 900
```
