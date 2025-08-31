# HEIC Photo Conversion Tool

## Quick Start

Place your iPhone photos (HEIC format) in a directory and run:

```bash
python3 tools/convert_heic_photos.py <photo_directory>
```

## Examples

```bash
# Most common usage - photos will be organized by date automatically
python3 tools/convert_heic_photos.py _temp_photos

# Custom output directory
python3 tools/convert_heic_photos.py _temp_photos img_running

# From any directory
python3 tools/convert_heic_photos.py ~/Desktop/race_photos
```

## Generic Image Resizer (JPG/PNG)

Use this for non-HEIC images (JPG/PNG) or when you just need a single web-friendly image (e.g., the frontpage image).

Quick start:

```bash
python3 tools/resize_image.py <input_path> <output_path> [--max-width N] [--max-height N] [--quality Q]
```

Defaults:
- max-width: 1600
- max-height: 1000
- quality: 85

What it does:
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

Frontpage image workflow:
1) Put your candidate file in `temp/`
2) Run the resizer to `./img_running/frontpage.jpg` (example above)
3) Point `index.md` include to `/img_running/frontpage.jpg`

Notes:
- The frontpage CSS uses `object-fit: cover` with a max height around 340–420px depending on viewport; choose composition accordingly.
- For iPhone HEIC photos, prefer the HEIC converter (uniform 600x600 square) for posts; use the generic resizer for banners/frontpage images.


## What it does

1. **Reads HEIC/HEIF files** from input directory
2. **Extracts date taken** from photo EXIF data
3. **Creates date directories** like `img_running/2025-08-16/`
4. **Center-crops to square** and then **resizes to 600x600** (no stretching)
5. **Maintains quality** at 95% JPEG quality
6. **Creates uniform format** for consistent blog layout

## Output Structure

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

Ready to use in blog posts with paths like:
```markdown
<img src="/img_running/2025-08-16/IMG_7671.jpg" alt="" class="w-100 pl-2 pr-2" style="max-width: 350px" />
```
