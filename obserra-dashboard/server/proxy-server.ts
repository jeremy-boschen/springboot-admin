import express, { type Request, Response, NextFunction } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { setupVite, serveStatic, log } from "./vite";
import config from "./config";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Create proxy middleware for API requests
const apiProxy = createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'  // No rewrite needed, just for clarity
  },
  logLevel: 'warn'
});

// Use the proxy middleware for API requests
app.use('/api', apiProxy);

// Use the proxy middleware for WebSocket connections
app.use('/ws', createProxyMiddleware({
  target: 'ws://localhost:5000',
  ws: true,
  changeOrigin: true
}));

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  throw err;
});

(async () => {
  const server = app.listen({
    port: 3000,
    host: '0.0.0.0',
    reusePort: true,
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  log(`UI server running on http://localhost:3000 (${app.get("env") === "development" ? 'development' : 'production'} mode)`);
  log(`Proxying API requests to Java backend at http://localhost:5000`);
})();