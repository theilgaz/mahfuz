#!/bin/sh
set -e

echo "Running database migrations..."
npx drizzle-kit migrate 2>&1 || echo "Warning: Migration failed, continuing with server startup"

echo "Starting server..."
exec node server.mjs
