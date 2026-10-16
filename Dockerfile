# ==============================================================================
# Unlupa v2 - Production Multi-Stage Dockerfile
# Stack: Node.js 22 LTS Alpine, React 19, Vite, Express, Prisma ORM, PostgreSQL
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Dependencies (All dependencies for compilation)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

# Copy package manifests and Prisma schema for client generation
COPY package.json package-lock.json ./
COPY prisma ./prisma

# Install all dependencies reproducible from lockfile
RUN npm ci

# Generate Prisma Client for use during build/typechecks
RUN npx prisma generate

# ------------------------------------------------------------------------------
# Stage 2: Application Builder (Frontend & Backend Bundler)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production

# Build Vite frontend assets and bundle Express backend to dist/server.js
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 3: Production Dependencies (Slim runtime node_modules)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS prod-deps
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY package.json package-lock.json ./
COPY prisma ./prisma

# Install only production dependencies
RUN npm ci --omit=dev

# Generate Prisma Client in the production node_modules
RUN npx prisma generate

# ------------------------------------------------------------------------------
# Stage 4: Production Runtime Runner
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install runtime utilities
RUN apk add --no-cache libc6-compat wget openssl

# Create unprivileged application user and group
RUN addgroup --system --gid 1001 unlupa && \
    adduser --system --uid 1001 -G unlupa unlupa

# Copy production dependencies and package.json
COPY --from=prod-deps --chown=unlupa:unlupa /app/node_modules ./node_modules
COPY --from=prod-deps --chown=unlupa:unlupa /app/package.json ./package.json

# Copy Prisma schema and migrations for production runtime migrations
COPY --from=builder --chown=unlupa:unlupa /app/prisma ./prisma

# Copy compiled frontend assets and backend server
COPY --from=builder --chown=unlupa:unlupa /app/dist ./dist

# Copy container startup script
COPY --chown=unlupa:unlupa docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Run as non-root user
USER unlupa

# Expose internal application port
EXPOSE 3000

# Health check using native wget against application health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
