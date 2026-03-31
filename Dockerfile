# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only package files first (better layer caching)
COPY package*.json ./

RUN npm ci --only=production

# ── Stage 2: Production image ──────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy installed deps from Stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Remove dev/local files that shouldn't be in the image
RUN rm -f .env

# Switch to non-root user
USER appuser

# Expose the port the app listens on
EXPOSE 3000

# Health check — used by HAProxy / Docker to verify container is alive
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
