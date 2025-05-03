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

# Build the client with Vite
RUN NODE_ENV=production npm run build

# Build the server separately using our production entry point
RUN NODE_ENV=production npx esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/server.js

# Stage 2: Create the production image
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Add configuration
COPY config.yaml /app/config.yaml

# Create a simpler structure for production
# Our production.ts file looks for static files in /app/public
RUN mkdir -p /app/public

# Copy server file (built with esbuild)
COPY --from=builder /app/dist/server.js ./dist/server.js

# Copy static files for the client (built with Vite) to the directory our production server expects
COPY --from=builder /app/dist/public/* ./public/

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
#CMD ["node", "dist/index.js"]
CMD ["node", "--inspect=0.0.0.0:9229", "dist/server.js"]
