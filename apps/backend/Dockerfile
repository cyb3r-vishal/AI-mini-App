# ==============================================================================
# Backend Dockerfile — multi-stage, pnpm workspace aware.
# ==============================================================================
#   build:   docker build -f apps/backend/Dockerfile -t ai-gen-backend .
#   run:     docker run -p 4000:4000 --env-file apps/backend/.env ai-gen-backend
# ==============================================================================

# ---- 1. Base ----------------------------------------------------------------
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
RUN apk add --no-cache openssl

# ---- 2. Install deps (cached) -----------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json tsconfig.base.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

# ---- 3. Build ---------------------------------------------------------------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend
# Generate Prisma client, then typecheck & compile.
RUN cd apps/backend && pnpm exec prisma generate
RUN pnpm --filter @ai-gen/backend build

# ---- 4. Runtime -------------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache openssl tini \
 && addgroup -S app && adduser -S app -G app
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/packages/shared ./packages/shared
COPY --from=build --chown=app:app /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=build --chown=app:app /app/apps/backend/dist ./apps/backend/dist
COPY --from=build --chown=app:app /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=build --chown=app:app /app/apps/backend/package.json ./apps/backend/

USER app
WORKDIR /app/apps/backend
EXPOSE 4000

# Apply pending migrations at boot, then start.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
