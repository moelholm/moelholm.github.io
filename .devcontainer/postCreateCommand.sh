#!/bin/bash

# Post-create commands for GitHub Codespaces
# This script runs after the codespace is created to set up dependencies

echo "🚀 Setting up blog development environment..."

# Install Python dependencies for photo processing
echo "📸 Installing photo processing dependencies..."
pip install -r tools/requirements.txt

# Install AWS CLI
echo "☁️ Installing AWS CLI..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf awscliv2.zip aws/

echo "✅ Environment setup complete!"
echo "🌐 To start Jekyll with drafts: ./dev-server.sh"
