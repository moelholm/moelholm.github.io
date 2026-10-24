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

# Start local Cloudflare likes mock server on port 8787 (cleaned up when dev-server stops)
LIKES_MOCK_SCRIPT="$SCRIPT_DIR/cloudflare-likes/local_dev_server.py"
pkill -f "$LIKES_MOCK_SCRIPT" 2>/dev/null || true
for _ in $(seq 1 20); do
	pgrep -f "$LIKES_MOCK_SCRIPT" >/dev/null || break
	sleep 0.1
done
python3 "$LIKES_MOCK_SCRIPT" &
LIKES_MOCK_PID=$!
trap 'kill "$LIKES_MOCK_PID" 2>/dev/null || true' EXIT INT TERM

echo "Press Ctrl+C to stop the server"

cd "$SITE_DIR"
bundle exec jekyll serve \
	--config _config.yml,_config_dev.yml \
	--host 0.0.0.0 --port 4000 --livereload
