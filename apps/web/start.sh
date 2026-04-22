#!/bin/sh
set -e

echo "Running database migrations..."
npx drizzle-kit migrate 2>&1 || echo "Warning: Migration failed, continuing with server startup"

echo "Checking static assets..."
if [ -d "dist/client" ]; then
  echo "dist/client: $(ls dist/client/ | wc -l) entries"
  echo "mushaf-pages: $(ls dist/client/mushaf-pages/ 2>/dev/null | wc -l) files"
  echo "assets: $(ls dist/client/assets/ 2>/dev/null | wc -l) files"
else
  echo "WARNING: dist/client directory not found!"
  ls -la dist/ 2>/dev/null || echo "dist/ directory also missing!"
fi

echo "Starting server..."
exec node server.mjs
