# Multi-stage build for smaller final image

# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the source code
COPY . .

# Set environment to production for the build
ENV NODE_ENV=production

# Build the application (both server and client)
# We must explicitly set NODE_ENV=production for the build
RUN NODE_ENV=production npm run build

# Stage 2: Create the production image
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Add configuration
COPY config.yaml /app/config.yaml

# Create dist directory structure expected by server/vite.ts
RUN mkdir -p /app/dist/public

# Copy server file (built with esbuild)
COPY --from=builder /app/dist/index.js ./dist/index.js

# Copy static files for the client (built with Vite) to match expected path
COPY --from=builder /app/dist/public ./dist/public

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

# Expose the port
EXPOSE 3000

# Start the application using the correct path to the server bundle
CMD ["node", "dist/index.js"]