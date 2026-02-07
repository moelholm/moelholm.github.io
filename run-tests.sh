#!/bin/bash
# Script to run carousel tests
# Usage: ./run-tests.sh

set -e

echo "🚀 Starting Jekyll server..."

# Check if Jekyll is already running
if curl -s http://localhost:4000 > /dev/null 2>&1; then
    echo "✅ Jekyll server is already running"
else
    echo "📦 Starting Jekyll server in background..."
    cd site && bundle exec jekyll serve --port 4000 > /tmp/jekyll.log 2>&1 &
    JEKYLL_PID=$!
    echo "Jekyll PID: $JEKYLL_PID"
    
    # Wait for server to start
    echo "⏳ Waiting for server to start..."
    for i in {1..30}; do
        if curl -s http://localhost:4000 > /dev/null 2>&1; then
            echo "✅ Server is ready!"
            break
        fi
        sleep 1
        echo -n "."
    done
    echo ""
fi

cd ..

echo "🧪 Running Playwright tests..."
npm test

echo "✅ Tests completed!"
