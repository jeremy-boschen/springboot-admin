# Multi-stage build for smaller final image

# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the source code
COPY . .

# Build the application (both server and client)
RUN npm run build

# Stage 2: Create the production image
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY --from=builder /app/build ./build

# Install only production dependencies
RUN npm ci --only=production

# Add configuration
COPY config.yaml /app/config.yaml

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

# Expose the port
EXPOSE 3000

# Start the application
CMD ["node", "build/server/index.js"]