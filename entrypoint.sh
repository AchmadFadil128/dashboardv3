#!/bin/sh
set -e

echo "[entrypoint] Syncing database schema..."
npx prisma db push --accept-data-loss

echo "[entrypoint] Running seed (idempotent)..."
node prisma/seed.js

echo "[entrypoint] Starting server..."
exec node src/app.js
