# syntax=docker/dockerfile:1.7

FROM oven/bun:1.1 AS base
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS builder
COPY . .
RUN bun run build

FROM oven/bun:1.1 AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000
COPY --from=base /app/node_modules ./node_modules
COPY --from=builder /app ./
EXPOSE 3000
CMD ["bun","run","start"]
