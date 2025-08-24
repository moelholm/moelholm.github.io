#!/bin/bash

echo "🚀 Starting Jekyll development server with unpublished posts enabled..."
echo "📝 Your unpublished posts (published: false) will be visible at http://localhost:4000"
echo "🔄 LiveReload is enabled for automatic browser refresh"
echo ""

echo "🧹 Cleaning _site directory for fresh build..."
rm -rf _site

echo "Press Ctrl+C to stop the server"
echo ""

bundle exec jekyll serve --config _config.yml,_config_dev.yml --host 0.0.0.0 --port 4000 --livereload
