import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";
import config from "./config";

// Create a simplified logger for production
function log(message: string, source = "express") {
  console.log(`${new Date().toLocaleTimeString()} [${source}] ${message}`);
}

// Initialize the Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add request logging middleware
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

// Production static file serving
function serveStatic(app: express.Express) {
  // In a Docker container, look for files in the /app/dist/public directory
  const publicPath = path.resolve(process.cwd(), "dist/public");
  
  if (!fs.existsSync(publicPath)) {
    throw new Error(
      `Could not find the public directory: ${publicPath}, make sure to build the client first`
    );
  }

  // Serve static files
  app.use(express.static(publicPath));

  // Serve index.html for any unmatched routes (SPA fallback)
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(publicPath, "index.html"));
  });
}

// Main startup function
(async () => {
  // Register API routes
  const server = await registerRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error(err);
  });

  // Setup static file serving for production
  serveStatic(app);

  // Get port and host from config
  const port = config.server.port || 3000;
  const host = config.server.host || '0.0.0.0';
  
  // Start the server
  server.listen({
    port,
    host,
    reusePort: true,
  }, () => {
    log(`serving on ${host}:${port} (production mode)`);
  });
})();