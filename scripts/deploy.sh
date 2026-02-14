#!/bin/bash

# Ensure script fails on error
set -e

echo "🚀 Starting deployment process..."

# Check if we are on main branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "main" ]]; then
  echo "⚠️  You are on branch '$BRANCH'. It is recommended to deploy from 'main'."
  read -p "Do you want to continue? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborting deployment."
    exit 1
  fi
fi

# Run build
echo "📦 Building project..."
npm run build

# Deploy to GitHub Pages
echo "📤 Deploying to GitHub Pages..."
npx gh-pages -d dist

echo "✅ Deployment complete! Your app should be live in a few minutes."
