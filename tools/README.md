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
