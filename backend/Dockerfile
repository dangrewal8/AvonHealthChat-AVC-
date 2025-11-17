# Backend Dockerfile
# Optimized multi-stage build for minimal image size
#
# Tech Stack: Docker + Node.js + TypeScript + Alpine Linux
# Expected size: ~150-200MB (vs 800MB+ without optimization)
#
# Usage:
#   docker build -t avonhealth-backend .
#   docker run -p 3001:3001 -e PORT=3001 avonhealth-backend

# ==============================================================================
# Stage 1: Dependencies (Production Only)
# ==============================================================================
FROM node:18-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# ==============================================================================
# Stage 2: Build Stage (Development Dependencies + Build)
# ==============================================================================
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# ==============================================================================
# Stage 3: Production Stage (Minimal Runtime Image)
# ==============================================================================
FROM node:18-alpine AS production

# Set NODE_ENV to production
ENV NODE_ENV=production

# Create app directory
WORKDIR /app

# Copy package.json for runtime
COPY package.json ./

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Copy healthcheck script
COPY healthcheck.js ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["node", "dist/index.js"]
