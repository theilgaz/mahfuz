# ── Stage 1: Base ──────────────────────────────────────
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# ── Stage 2: Dependencies ─────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/audio-engine/package.json packages/audio-engine/
COPY packages/recitation-engine/package.json packages/recitation-engine/
COPY packages/shared/package.json packages/shared/
COPY tooling/tailwind/package.json tooling/tailwind/
COPY tooling/typescript/package.json tooling/typescript/
COPY tooling/eslint/package.json tooling/eslint/
RUN pnpm install --frozen-lockfile

# ── Stage 3: Build ─────────────────────────────────────
FROM deps AS build
COPY . .
ENV DEPLOY_TARGET=docker
RUN pnpm turbo build --filter=@mahfuz/web \
    && echo "Build output:" \
    && ls -la apps/web/dist/ \
    && ls apps/web/dist/client/ | head -20 \
    && echo "mushaf-pages: $(ls apps/web/dist/client/mushaf-pages/ | wc -l) files"

# ── Stage 4: Runner ────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production

# Monorepo root (needed for pnpm workspace resolution)
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./

# Package manifests for prod install
COPY --from=build /app/apps/web/package.json apps/web/
COPY --from=build /app/packages/shared/package.json packages/shared/
COPY --from=build /app/packages/audio-engine/package.json packages/audio-engine/
COPY --from=build /app/packages/recitation-engine/package.json packages/recitation-engine/
COPY --from=build /app/tooling/tailwind/package.json tooling/tailwind/
COPY --from=build /app/tooling/typescript/package.json tooling/typescript/
COPY --from=build /app/tooling/eslint/package.json tooling/eslint/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Built app artifacts — client + server
COPY --from=build /app/apps/web/dist/server apps/web/dist/server
COPY --from=build /app/apps/web/dist/client apps/web/dist/client
COPY --from=build /app/apps/web/drizzle apps/web/drizzle
COPY --from=build /app/apps/web/drizzle.config.ts apps/web/drizzle.config.ts
COPY --from=build /app/apps/web/server.mjs apps/web/server.mjs
COPY --from=build /app/apps/web/start.sh apps/web/start.sh

# Runtime packages (built source needed by server)
COPY --from=build /app/packages/shared packages/shared
COPY --from=build /app/packages/audio-engine packages/audio-engine
COPY --from=build /app/packages/recitation-engine packages/recitation-engine
COPY --from=build /app/tooling tooling

ENV PORT=3000
EXPOSE 3000

WORKDIR /app/apps/web
CMD ["sh", "start.sh"]
