FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Install semua deps (termasuk dev) agar prisma CLI & generate bisa jalan
RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

FROM node:20-alpine

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
