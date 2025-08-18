#!/bin/bash

echo "🚀 Starting Jekyll production server..."
echo "📝 Draft posts will be HIDDEN (production mode)"
echo "🔄 LiveReload is enabled for automatic browser refresh"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

bundle exec jekyll serve --host 0.0.0.0 --port 4000 --config _config.yml --livereload
