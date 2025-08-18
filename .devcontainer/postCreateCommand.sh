#!/bin/bash

# Post-create commands for GitHub Codespaces
# This script runs after the codespace is created to set up dependencies

echo "🚀 Setting up blog development environment..."

# Install Python dependencies for photo processing
echo "📸 Installing photo processing dependencies..."
pip install -r requirements.txt

echo "✅ Environment setup complete!"
echo "🎯 You can now use: python3 tools/convert_heic_photos.py <input_directory>"
echo "🌐 To start Jekyll with drafts: bundle exec jekyll serve --config _config.yml,_config_dev.yml"
