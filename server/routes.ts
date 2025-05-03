import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scheduleServiceDiscovery } from "./k8s/service-discovery";
import { scheduleMetricsCollection, collectServiceMetrics } from "./actuator/metrics";
import { k8sClient } from "./k8s/client";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  const apiRouter = app.route('/api');
  
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
      
      const logs = await storage.getLogsForService(serviceId, 100);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  });
  
  // Restart a service
  app.post('/api/services/:id/restart', async (req: Request, res: Response) => {
    try {
      const serviceId = parseInt(req.params.id);
      const service = await storage.getService(serviceId);
      
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }
      
      // For now, this is a mock restart since we need to map to the actual Kubernetes deployment
      // In a real implementation, we would restart the deployment/pod
      
      // Trigger a fresh metrics collection for the service
      await collectServiceMetrics(serviceId, service.actuatorUrl);
      
      res.json({ message: 'Service restart initiated' });
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
  
  // Start the service discovery and metrics collection processes
  scheduleServiceDiscovery(60000); // Check for new services every minute
  scheduleMetricsCollection(30000); // Collect metrics every 30 seconds
  
  const httpServer = createServer(app);
  return httpServer;
}
