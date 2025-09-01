#!/bin/bash
set -euo pipefail

echo "🚀 Starting Jekyll dev server from ./site with drafts and LiveReload..."
echo "URL: http://localhost:4000"

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
SITE_DIR="$REPO_ROOT/site"

if [ ! -d "$SITE_DIR" ]; then
	echo "Error: site/ not found at $SITE_DIR" >&2
	exit 1
fi

echo "🧹 Cleaning site/_site for a fresh build..."
rm -rf "$SITE_DIR/_site"

echo "Press Ctrl+C to stop the server"

cd "$SITE_DIR"
bundle exec jekyll serve \
	--config _config.yml,_config_dev.yml \
	--host 0.0.0.0 --port 4000 --livereload
