#!/bin/bash
# Rotate an image 90 degrees clockwise (right).
# Call multiple times for additional rotation.
#
# Usage: ./tools/rotate-image.sh <image_path>
# Example: ./tools/rotate-image.sh site/img_running/2025-12-07/IMG_0057.jpg

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

if [ $# -lt 1 ]; then
    echo "Usage: $0 <image_path>"
    echo "Rotates the image 90° clockwise. Call multiple times for more rotation."
    exit 1
fi

python3 "$SCRIPT_DIR/rotate_image.py" "$1"
