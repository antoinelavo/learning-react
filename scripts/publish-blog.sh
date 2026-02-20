#!/bin/bash
# Publish a blog post: regenerate sitemap, commit, and push
# Usage: ./scripts/publish-blog.sh <slug> "<post title>"

set -e

SLUG="$1"
TITLE="${2:-$SLUG}"

if [ -z "$SLUG" ]; then
  echo "Usage: ./scripts/publish-blog.sh <slug> \"<post title>\""
  exit 1
fi

MDX_FILE="content/blog/${SLUG}.mdx"

if [ ! -f "$MDX_FILE" ]; then
  echo "Error: $MDX_FILE does not exist"
  exit 1
fi

echo "Regenerating sitemap..."
node scripts/generate-sitemap.js

echo "Staging files..."
git add "$MDX_FILE" public/sitemap.xml

echo "Committing..."
git commit -m "publish: ${TITLE}"

echo "Pushing to origin..."
git push origin main

echo "Done! Post will be live after Vercel deploys (~60s)."
