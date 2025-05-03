# ─────────────────────────────────────────────────────
# 🧱 Stage 1: Builder
# - Installs all dependencies
# - Builds both client (Vite) and server (esbuild)
# - Prunes devDependencies before handing off to final stage
# ─────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Set working directory in the builder container
WORKDIR /app

# Copy only files needed to install dependencies first (for better Docker layer caching)
COPY package.json package-lock.json ./

# Install ALL dependencies (prod + dev)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the frontend with Vite and backend with esbuild
RUN npm run build

# Remove devDependencies — leaves only production deps in node_modules
RUN npm prune --production

# ─────────────────────────────────────────────────────
# 🚀 Stage 2: Runtime
# - Copies only the compiled output and pruned dependencies
# - Uses a non-root user for security
# - Exposes app and debug ports
# ─────────────────────────────────────────────────────
FROM node:20-alpine

# Set the working directory in the runtime container
WORKDIR /app

# Create a non-root user and group for safer container execution
RUN addgroup -S app && adduser -S app -G app

# Add configuration
COPY --chown=app:app config.yaml /app/config.yaml

# Copy production node_modules, compiled app, and manifest
COPY --from=builder --chown=app:app /app/dist ./dist
COPY --from=builder --chown=app:app /app/package.json ./
COPY --from=builder --chown=app:app /app/node_modules ./node_modules

# Change ownership of app files to the non-root user
RUN chown app:app /app

# Switch to the non-root user
USER app

# Define the runtime environment
ENV NODE_ENV=production

# Document the ports used:
# - 3000: your main application
# - 9229: Node.js debugger
EXPOSE 3000 9229

# Default command for production (Skaffold will override this in debug mode)
CMD ["node", "dist/server.js"]
