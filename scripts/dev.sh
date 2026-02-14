#!/bin/bash

# Ensure script fails on error
set -e

echo "🚀 Starting Bolt The Word development server..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Dependencies not found. Installing..."
  npm install
fi

echo "✨ igniting planeswalker spark..."
npm run dev
