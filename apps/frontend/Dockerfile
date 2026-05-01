# ==============================================================================
# Frontend Dockerfile — Next.js 14, pnpm workspace aware.
# ==============================================================================
#   build:   docker build -f apps/frontend/Dockerfile -t ai-gen-frontend .
#   run:     docker run -p 3000:3000 \
#              -e NEXT_PUBLIC_API_URL=http://backend:4000 \
#              ai-gen-frontend
# ==============================================================================

FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# ---- deps -------------------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json tsconfig.base.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

# ---- build ------------------------------------------------------------------
FROM base AS build
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG NEXT_PUBLIC_APP_NAME="AI App Generator"
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend

RUN pnpm --filter @ai-gen/frontend build

# ---- runtime ----------------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY --from=build --chown=app:app /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=build --chown=app:app /app/apps/frontend/public ./apps/frontend/public
COPY --from=build --chown=app:app /app/apps/frontend/package.json ./apps/frontend/
COPY --from=build --chown=app:app /app/apps/frontend/next.config.mjs ./apps/frontend/
COPY --from=build --chown=app:app /app/packages/shared ./packages/shared

USER app
WORKDIR /app/apps/frontend
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "-p", "3000"]
