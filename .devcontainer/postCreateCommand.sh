#!/bin/bash

# Post-create commands for GitHub Codespaces
# This script runs after the codespace is created to set up dependencies

echo "🚀 Setting up blog development environment..."

# Install Python dependencies for photo processing
echo "📸 Installing photo processing dependencies..."
pip install -r tools/requirements.txt

echo "✅ Environment setup complete!"
echo "🌐 To start Jekyll with drafts: ./dev-server.sh"
