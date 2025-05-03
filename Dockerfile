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
# Copy the built files from the correct directory
COPY --from=builder /app/dist ./dist
# Copy the client-side assets (static Vite output)
COPY --from=builder /app/client/dist ./client/dist

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

# Start the application using the correct path to the server bundle
CMD ["node", "dist/index.js"]