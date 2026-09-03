#!/bin/sh
set -e

echo "[entrypoint] Ensuring uploads directory exists..."
mkdir -p /app/uploads

echo "[entrypoint] Syncing database schema..."
bunx prisma db push

echo "[entrypoint] Running seed (idempotent)..."
bun prisma/seed.js

echo "[entrypoint] Starting server..."
exec bun src/app.js
