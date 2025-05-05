import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { scheduleServiceDiscovery } from "./k8s/service-discovery";
import { scheduleMetricsCollection, collectServiceMetrics, collectServiceLogs } from "./actuator/metrics";
import { k8sClient } from "./k8s/client";
import { createActuatorClient } from "./actuator/client";
import { insertConfigPropertySchema, serviceRegistrationSchema, ServiceRegistration } from "@shared/schema";
import { z } from 'zod';
import { checkActuatorHealth } from "./actuator/health-check";
import axios from "axios";
import config from "./config";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  const apiRouter = app.route('/api');
  
  // 0. Service registration endpoint
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      console.log('Received registration request:', req.body);
      
      // Validate request body against schema
      const result = serviceRegistrationSchema.safeParse(req.body);
      if (!result.success) {
        const errorMessage = result.error.format();
        return res.status(400).json({ 
          error: 'Invalid registration data', 
          details: errorMessage 
        });
      }
      
      // Extract validated data
      const registrationData: ServiceRegistration = result.data;
      
      // Check if the actuator URL is reachable
      try {
        const healthEndpoint = registrationData.actuatorUrl +
          (registrationData.healthCheckPath || '/actuator/health');
        
        await axios.get(healthEndpoint, { timeout: 5000 });
      } catch (error) {
        console.error('Error connecting to service at registration:', error);
        // Continue with registration but log the issue
      }
      
      // Register the service
      const service = await storage.registerService(registrationData);
      
      // Perform initial health check
      const status = await checkActuatorHealth(service);
      await storage.updateServiceStatus(service.id, status);
      await storage.updateServiceLastSeen(service.id);
      
      // Return the registered service
      res.status(201).json({
        id: service.id,
        name: service.name,
        status,
        registrationSource: service.registrationSource,
        appId: service.appId
      });
      
    } catch (error) {
      console.error('Error registering service:', error);
      res.status(500).json({ error: 'Failed to register service' });
    }
  });
  
  // 1. Services endpoints
  
  // Get all services
  app.get('/api/services', async (req: Request, res: Response) => {
    try {
      const services = await storage.getAllServices();
      
      // Enhance service data with metrics for the dashboard
      const enhancedServices = await Promise.all(services.map(async (service) => {
        // Get recent metrics
        const metrics = await storage.getMetricsForService(service.id, 10);
        
        // Calculate memory trend
        const memoryTrend = metrics.length > 0
          ? metrics.map(m => m.memoryUsed / m.memoryMax * 100).reverse()
          : [];
        
        // Calculate CPU trend
        const cpuTrend = metrics.length > 0
          ? metrics.map(m => m.cpuUsage * 100).reverse()
          : [];
        
        // Calculate error trend
        const errorTrend = metrics.length > 0
          ? metrics.map(m => m.errorCount).reverse()
          : [];
        
        // Get the most recent metric for current values
        const latestMetric = metrics[0];
        
        return {
          ...service,
          memory: latestMetric ? {
            used: Math.round(latestMetric.memoryUsed),
            max: Math.round(latestMetric.memoryMax),
            trend: memoryTrend
          } : undefined,
          cpu: latestMetric ? {
            used: latestMetric.cpuUsage,
            max: 1,
            trend: cpuTrend
          } : undefined,
          errors: {
            count: metrics.reduce((sum, m) => sum + m.errorCount, 0),
            trend: errorTrend
          }
        };
      }));
      
      res.json(enhancedServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ error: 'Failed to fetch services' });
    }
  });
  
  // Get a specific service
  app.get('/api/services/:id', async (req: Request, res: Response) => {
    try {
      const serviceId = parseInt(req.params.id);
      const service = await storage.getService(serviceId);
      
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }
      
      res.json(service);
    } catch (error) {
      console.error('Error fetching service:', error);
      res.status(500).json({ error: 'Failed to fetch service' });
    }
  });
  
  // Get metrics for a service
  app.get('/api/services/:id/metrics', async (req: Request, res: Response) => {
    try {
      const serviceId = parseInt(req.params.id);
      const service = await storage.getService(serviceId);
      
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }
      
      const metrics = await storage.getMetricsForService(serviceId, 10);
      
      // Format metrics for the frontend
      const memoryTrend = metrics.length > 0
        ? metrics.map(m => m.memoryUsed / m.memoryMax * 100).reverse()
        : [];
      
      const cpuTrend = metrics.length > 0
        ? metrics.map(m => m.cpuUsage * 100).reverse()
        : [];
      
      const errorTrend = metrics.length > 0
        ? metrics.map(m => m.errorCount).reverse()
        : [];
      
      // Get the most recent metric for current values
      const latestMetric = metrics[0];
      
      const formattedMetrics = {
        memory: latestMetric ? {
          used: Math.round(latestMetric.memoryUsed),
          max: Math.round(latestMetric.memoryMax),
          trend: memoryTrend
        } : { used: 0, max: 0, trend: [] },
        cpu: latestMetric ? {
          used: latestMetric.cpuUsage,
          max: 1,
          trend: cpuTrend
        } : { used: 0, max: 1, trend: [] },
        errors: {
          count: metrics.reduce((sum, m) => sum + m.errorCount, 0),
          trend: errorTrend
        }
      };
      
      res.json(formattedMetrics);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  });
  
  // Get logs for a service
  app.get('/api/services/:id/logs', async (req: Request, res: Response) => {
    try {
      const serviceId = parseInt(req.params.id);
      const service = await storage.getService(serviceId);
      
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }
      
      // Get the limit from config or query param
      const limitParam = req.query.limit ? parseInt(req.query.limit as string) : null;
      const configLimit = config.logs.recentLimit;
      const limit = limitParam || configLimit || 100;
      
      const logs = await storage.getLogsForService(serviceId, limit);
      
      // Ensure that all log entries have valid timestamps
      const sanitizedLogs = logs.map(log => {
        // Create a sanitized copy with guaranteed timestamp
        return {
          ...log,
          timestamp: log.timestamp || new Date().toISOString()
        };
      });
      
      res.json(sanitizedLogs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  });
  
  /**
   * Restart a Kubernetes service (pod/deployment)
   * 
   * Triggers a restart of the specified service by leveraging the Kubernetes API.
   * The implementation uses the Kubernetes client to identify and restart the
   * corresponding deployment or pod. After initiating the restart, a fresh
   * metrics collection is triggered to update the service status.
   */
  app.post('/api/services/:id/restart', async (req: Request, res: Response) => {
    try {
      const serviceId = parseInt(req.params.id);
      const service = await storage.getService(serviceId);
      
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }
      
      // Use the Kubernetes client to handle the restart operation
      const restartResult = await k8sClient.restartService(
        service.namespace,
        service.podName
      );
      
      if (!restartResult.success) {
        return res.status(500).json({ 
          error: 'Failed to restart service',
          details: restartResult.message
        });
      }
      
      // Trigger a fresh metrics collection for the service
      await collectServiceMetrics(serviceId, service.actuatorUrl);
      
      res.json({ 
        message: 'Service restart initiated',
        details: restartResult.message
      });
    } catch (error) {
      console.error('Error restarting service:', error);
      res.status(500).json({ error: 'Failed to restart service' });
    }
  });
  
  // 2. Kubernetes endpoints
  
  // Get namespaces
  app.get('/api/namespaces', async (req: Request, res: Response) => {
    try {
      const namespaces = await k8sClient.listNamespaces();
      res.json(namespaces.map(ns => ({
        name: ns.metadata?.name,
        status: ns.status?.phase
      })));
    } catch (error) {
      console.error('Error fetching namespaces:', error);
      res.status(500).json({ error: 'Failed to fetch namespaces' });
    }
  });
  
  // 3. Logger management endpoints
  
  // Get available loggers and their levels
  app.get('/api/services/:id/loggers', async (req: Request, res: Response) => {
    try {
      const serviceId = parseInt(req.params.id);
      const service = await storage.getService(serviceId);
      
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }
      
      const actuatorClient = createActuatorClient(service.actuatorUrl);
      const loggers = await actuatorClient.getLoggers();
      
      res.json(loggers);
    } catch (error) {
      console.error('Error fetching loggers:', error);
      res.status(500).json({ error: 'Failed to fetch loggers' });
    }
  });
  
  // Set logger level
  app.post('/api/services/:id/loggers/:logger', async (req: Request, res: Response) => {
    try {
      const serviceId = parseInt(req.params.id);
      const loggerName = req.params.logger;
      const level = req.body.level;
      
      if (!level || typeof level !== 'string') {
        return res.status(400).json({ error: 'Invalid log level' });
      }
      
      const service = await storage.getService(serviceId);
      
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }
      
      const actuatorClient = createActuatorClient(service.actuatorUrl);
      const success = await actuatorClient.setLogLevel(loggerName, level);
      
      if (success) {
        res.json({ message: `Log level for ${loggerName} set to ${level}` });
      } else {
        res.status(500).json({ error: 'Failed to set log level' });
      }
    } catch (error) {
      console.error('Error setting log level:', error);
      res.status(500).json({ error: 'Failed to set log level' });
    }
  });
  
  // 4. Configuration management endpoints
  
  // Get all configuration properties for a service
  app.get('/api/services/:id/config', async (req: Request, res: Response) => {
    try {
      const serviceId = parseInt(req.params.id);
      const service = await storage.getService(serviceId);
      
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }
      
      const properties = await storage.getConfigPropertiesForService(serviceId);
      res.json(properties);
    } catch (error) {
      console.error('Error fetching configuration properties:', error);
      res.status(500).json({ error: 'Failed to fetch configuration properties' });
    }
  });
  
  // Get a specific configuration property
  app.get('/api/services/:id/config/:propertyId', async (req: Request, res: Response) => {
    try {
      const serviceId = parseInt(req.params.id);
      const propertyId = parseInt(req.params.propertyId);
      
      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }
      
      const property = await storage.getConfigProperty(propertyId);
      if (!property || property.serviceId !== serviceId) {
        return res.status(404).json({ error: 'Configuration property not found' });
      }
      
      res.json(property);
    } catch (error) {
      console.error('Error fetching configuration property:', error);
      res.status(500).json({ error: 'Failed to fetch configuration property' });
    }
  });
  
  // Create a new configuration property
  app.post('/api/services/:id/config', async (req: Request, res: Response) => {
    try {
      const serviceId = parseInt(req.params.id);
      
      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }
      
      // Validate the property data
      const propertyData = { ...req.body, serviceId };
      const result = insertConfigPropertySchema.safeParse(propertyData);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: 'Invalid configuration property data', 
          details: result.error.format() 
        });
      }
      
      const property = await storage.createConfigProperty(result.data);
      res.status(201).json(property);
    } catch (error) {
      console.error('Error creating configuration property:', error);
      res.status(500).json({ error: 'Failed to create configuration property' });
    }
  });
  
  // Update a configuration property
  app.put('/api/services/:id/config/:propertyId', async (req: Request, res: Response) => {
    try {
      const serviceId = parseInt(req.params.id);
      const propertyId = parseInt(req.params.propertyId);
      
      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }
      
      const existingProperty = await storage.getConfigProperty(propertyId);
      if (!existingProperty || existingProperty.serviceId !== serviceId) {
        return res.status(404).json({ error: 'Configuration property not found' });
      }
      
      // Validate the update data (excluding serviceId to prevent reassignment)
      const updateData = { ...req.body };
      delete updateData.serviceId;
      
      const property = await storage.updateConfigProperty(propertyId, updateData);
      res.json(property);
    } catch (error) {
      console.error('Error updating configuration property:', error);
      res.status(500).json({ error: 'Failed to update configuration property' });
    }
  });
  
  // Delete a configuration property
  app.delete('/api/services/:id/config/:propertyId', async (req: Request, res: Response) => {
    try {
      const serviceId = parseInt(req.params.id);
      const propertyId = parseInt(req.params.propertyId);
      
      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }
      
      const existingProperty = await storage.getConfigProperty(propertyId);
      if (!existingProperty || existingProperty.serviceId !== serviceId) {
        return res.status(404).json({ error: 'Configuration property not found' });
      }
      
      await storage.deleteConfigProperty(propertyId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting configuration property:', error);
      res.status(500).json({ error: 'Failed to delete configuration property' });
    }
  });

  // Start the service discovery and metrics collection processes
  scheduleServiceDiscovery(60000); // Check for new services every minute
  scheduleMetricsCollection(30000); // Collect metrics every 30 seconds
  
  const httpServer = createServer(app);
  
  /**
   * WebSocket Server Implementation for Real-time Log Streaming
   *
   * This section sets up a WebSocket server to provide real-time log streaming capabilities.
   * The implementation includes:
   * 
   * 1. A WebSocket server attached to the existing HTTP server on path '/ws'
   * 2. Client subscription management (clients can subscribe to specific service IDs)
   * 3. Broadcast mechanism to send logs only to clients interested in specific services
   * 4. Extension of the log collection process to broadcast new logs as they arrive
   * 
   * The WebSocket protocol supports the following message types:
   * - 'subscribe': Client requests to receive logs for a specific service
   * - 'unsubscribe': Client requests to stop receiving logs for a service
   * 
   * Messages sent to clients:
   * - 'logs': Server sends log entries for services the client has subscribed to
   */
  if (config.logs.websocketEnabled) {
    // Create WebSocket server on '/ws' path to avoid conflicts with Vite HMR
    const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
    
    // Track connected clients and their subscribed service IDs
    // This map allows targeting log broadcasts only to interested clients
    const clients = new Map<WebSocket, Set<number>>();
    
    wss.on('connection', (ws) => {
      // Initialize empty set for this client's subscriptions
      clients.set(ws, new Set());
      
      console.log('WebSocket client connected');
      
      // Handle subscription messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          if (data.type === 'subscribe' && data.serviceId) {
            const serviceId = parseInt(data.serviceId);
            const clientSubscriptions = clients.get(ws);
            
            if (clientSubscriptions) {
              clientSubscriptions.add(serviceId);
              console.log(`WebSocket client subscribed to service ${serviceId}`);
            }
          } else if (data.type === 'unsubscribe' && data.serviceId) {
            const serviceId = parseInt(data.serviceId);
            const clientSubscriptions = clients.get(ws);
            
            if (clientSubscriptions) {
              clientSubscriptions.delete(serviceId);
              console.log(`WebSocket client unsubscribed from service ${serviceId}`);
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      });
      
      // Handle disconnections
      ws.on('close', () => {
        clients.delete(ws);
        console.log('WebSocket client disconnected');
      });
    });
    
    // Create a function to broadcast logs to subscribed clients
    const broadcastLogs = (serviceId: number, logs: any[]) => {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          const subscriptions = clients.get(client);
          if (subscriptions && subscriptions.has(serviceId)) {
            client.send(JSON.stringify({
              type: 'logs',
              serviceId,
              logs
            }));
          }
        }
      });
    };
    
    // Hook this into the log collection process
    // This is a monkey patch to broadcast logs whenever new ones are collected
    const originalCollectServiceLogs = collectServiceLogs;
    
    // Override the collectServiceLogs function to also broadcast logs via WebSocket
    (global as any).collectServiceLogs = async (serviceId: number, actuatorUrl: string) => {
      // Call the original function to collect logs
      const logs = await originalCollectServiceLogs(serviceId, actuatorUrl);
      
      // If we received logs, broadcast them to subscribed clients
      if (logs && logs.length > 0) {
        broadcastLogs(serviceId, logs);
      }
      
      return logs;
    }
  }
  
  return httpServer;
}
