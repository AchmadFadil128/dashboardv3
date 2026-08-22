#!/bin/sh
set -e

echo "[entrypoint] Ensuring uploads directory exists..."
mkdir -p /app/uploads

echo "[entrypoint] Syncing database schema..."
npx prisma db push

echo "[entrypoint] Running seed (idempotent)..."
node prisma/seed.js

echo "[entrypoint] Starting server..."
exec node src/app.js
