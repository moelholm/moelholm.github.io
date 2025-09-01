#!/bin/bash
set -euo pipefail

echo "🚀 Starting Jekyll production server from ./site ..."
echo "Draft posts are hidden. URL: http://localhost:4000"

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
SITE_DIR="$REPO_ROOT/site"

cd "$SITE_DIR"
bundle exec jekyll serve --host 0.0.0.0 --port 4000 --config _config.yml --livereload
