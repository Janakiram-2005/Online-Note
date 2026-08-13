# Production Dockerfile for Google Cloud Run deployment
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application (vite build + esbuild server.ts)
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package manifests and install production-only dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built server and static assets
COPY --from=builder /app/dist ./dist

# Create local data directory for fallback storage
RUN mkdir -p /app/.data

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
