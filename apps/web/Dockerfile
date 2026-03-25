# ── Stage 1: Base ──────────────────────────────────────
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# ── Stage 2: Dependencies ─────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/audio-engine/package.json packages/audio-engine/
COPY packages/shared/package.json packages/shared/
COPY tooling/tailwind/package.json tooling/tailwind/
COPY tooling/typescript/package.json tooling/typescript/
COPY tooling/eslint/package.json tooling/eslint/
RUN pnpm install --frozen-lockfile

# ── Stage 3: Build ─────────────────────────────────────
FROM deps AS build
COPY . .
ENV DEPLOY_TARGET=docker
RUN pnpm turbo build --filter=@mahfuz/web

# ── Stage 4: Runner ────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

# Monorepo root
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./

# Built app
COPY --from=build /app/apps/web/dist apps/web/dist
COPY --from=build /app/apps/web/drizzle apps/web/drizzle
COPY --from=build /app/apps/web/server.mjs apps/web/server.mjs
COPY --from=build /app/apps/web/package.json apps/web/

# Runtime packages
COPY --from=build /app/packages/shared packages/shared
COPY --from=build /app/packages/audio-engine packages/audio-engine
COPY --from=build /app/tooling tooling

# Node modules
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/apps/web/node_modules apps/web/node_modules

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

WORKDIR /app/apps/web
CMD ["node", "server.mjs"]
