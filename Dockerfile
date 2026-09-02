FROM oven/bun:alpine AS builder

WORKDIR /app

COPY package*.json bun.lock* ./
# Install semua deps (termasuk dev) agar prisma CLI & generate bisa jalan
RUN bun install

COPY prisma ./prisma/
RUN bunx prisma generate

FROM oven/bun:alpine

RUN apk add --no-cache openssl libssl3

WORKDIR /app

RUN addgroup --system app && adduser --system --ingroup app app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package.json ./
COPY src/ ./src/
COPY entrypoint.sh ./entrypoint.sh

RUN chmod +x /app/entrypoint.sh \
    && mkdir -p /app/src/public \
    && chown -R app:app /app

USER app

EXPOSE 4000

ENTRYPOINT ["/app/entrypoint.sh"]
