# Syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# SQL migrations and their manifest aren't compiled by tsc (non-TS assets),
# so copy the raw dir on top of the build output.
COPY src/db/migrations ./dist/db/migrations
EXPOSE 3001
# Run migrations (node dist/db/migrate.js auto-executes as main entry), then start.
CMD ["sh", "-c", "node dist/db/migrate.js && node dist/server.js"]
