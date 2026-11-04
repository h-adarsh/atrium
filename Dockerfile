# Multi-stage Dockerfile for Atrium Production Deployment on OCI
# Supports both ARM64 (Ampere A1) and AMD64 (x86_64)

# Stage 1: Build Client (React 19 + Vite + Tailwind v4 + Sen Font)
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build Server (Node.js + TypeScript + Prisma)
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
COPY server/prisma ./prisma/
RUN npm ci
RUN npx prisma generate
COPY server/ ./
RUN npm run build

# Stage 3: Hardened Production Runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001

# Copy server package and production dependencies
COPY server/package*.json ./server/
COPY server/prisma ./server/prisma/
COPY server/tsconfig.json ./server/
WORKDIR /app/server
RUN npm ci --only=production && npx prisma generate

# Copy compiled server code
COPY --from=server-builder /app/server/dist ./dist

# Copy built frontend assets so Express serves them
COPY --from=client-builder /app/client/dist /app/client/dist

# Copy entrypoint script
COPY docker-entrypoint.sh /app/server/docker-entrypoint.sh
RUN chmod +x /app/server/docker-entrypoint.sh

# Create uploads directory and enforce unprivileged non-root ownership
RUN mkdir -p /app/server/uploads/receipts && chown -R node:node /app

# Run as non-root unprivileged user
USER node

EXPOSE 5001

ENTRYPOINT ["/app/server/docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
