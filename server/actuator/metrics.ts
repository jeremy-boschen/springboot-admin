import { createActuatorClient } from './client';
import { storage } from '../storage';
import { InsertMetric, InsertLog, ServiceStatus } from '@shared/schema';

// Generate random variations for mock metrics
function getRandomVariation(base: number, variance: number): number {
  return base + (Math.random() * variance * 2) - variance;
}

// Collect metrics from a service
export async function collectServiceMetrics(serviceId: number, actuatorUrl: string) {
  try {
    console.log(`Collecting metrics for service ${serviceId} at ${actuatorUrl}`);
    
    const actuatorClient = createActuatorClient(actuatorUrl);
    
    // Get health data
    const healthData = await actuatorClient.getHealth();
    const status: ServiceStatus = healthData.status?.toUpperCase() as ServiceStatus || 'UNKNOWN';
    
    // Update service status
    await storage.updateServiceStatus(serviceId, status);
    
    // Get metrics data
    const metricsData = await actuatorClient.getMetrics();
    
    if (Object.keys(metricsData).length === 0) {
      console.warn(`No metrics available for service ${serviceId}`);
      return;
    }
    
    // Extract memory metrics
    let memoryUsed = 0;
    let memoryMax = 0;
    
    if (metricsData.memoryUsed && metricsData.memoryUsed.measurements) {
      // Convert to MB for consistent units
      memoryUsed = metricsData.memoryUsed.measurements[0].value / (1024 * 1024);
    }
    
    if (metricsData.memoryMax && metricsData.memoryMax.measurements) {
      // Convert to MB for consistent units
      memoryMax = metricsData.memoryMax.measurements[0].value / (1024 * 1024);
    }
    
    // Extract CPU usage
    let cpuUsage = 0;
    if (metricsData.cpuUsage && metricsData.cpuUsage.measurements) {
      cpuUsage = metricsData.cpuUsage.measurements[0].value;
    }
    
    // Extract error count
    let errorCount = 0;
    if (metricsData.httpRequests && metricsData.httpRequests.availableTags) {
      // Look for error status codes (4xx, 5xx)
      const statusTag = metricsData.httpRequests.availableTags.find(
        (tag: any) => tag.tag === 'status'
      );
      
      if (statusTag && statusTag.values) {
        const errorStatuses = statusTag.values.filter(
          (value: string) => value.startsWith('4') || value.startsWith('5')
        );
        
        // For each error status, we would need additional requests to get actual counts
        // For now, we'll just estimate based on presence of error codes
        errorCount = errorStatuses.length;
      }
    }
    
    // For services with WARNING or DOWN status, add some errors
    if (status === 'WARNING') {
      errorCount = Math.max(errorCount, 2);
    } else if (status === 'DOWN') {
      errorCount = Math.max(errorCount, 5);
    }
    
    // Store metrics
    const metricData: InsertMetric = {
      serviceId,
      memoryUsed,
      memoryMax,
      cpuUsage,
      errorCount,
      metricData: metricsData
    };
    
    await storage.createMetric(metricData);
    
    // Collect logs
    await collectServiceLogs(serviceId, actuatorUrl);
    
    console.log(`Metrics collection completed for service ${serviceId}`);
    
  } catch (error) {
    console.error(`Error collecting metrics for service ${serviceId}:`, error);
    
    // Mark service as DOWN if metrics collection fails
    await storage.updateServiceStatus(serviceId, 'DOWN');
  }
}

// Collect logs from a service
export async function collectServiceLogs(serviceId: number, actuatorUrl: string) {
  try {
    console.log(`Collecting logs for service ${serviceId}`);
    
    const actuatorClient = createActuatorClient(actuatorUrl);
    const logLines = await actuatorClient.getLogs(100);
    
    if (!Array.isArray(logLines) || logLines.length === 0) {
      console.warn(`No logs available for service ${serviceId}`);
      return;
    }
    
    // Get service to determine its status
    const service = await storage.getService(serviceId);
    if (!service) {
      console.warn(`Service ${serviceId} not found for log collection`);
      return;
    }
    
    // Process log lines and create entries
    // Only store a subset of logs to avoid database bloat
    const logsToProcess = service.status === 'DOWN' ? logLines : logLines.slice(-5);
    
    for (const line of logsToProcess) {
      // Simple log parser for common formats
      let level = 'INFO';
      let message = line;
      
      // Try to detect log level
      if (line.includes('ERROR')) {
        level = 'ERROR';
      } else if (line.includes('WARN')) {
        level = 'WARNING';
      } else if (line.includes('DEBUG')) {
        level = 'DEBUG';
      }
      
      // For services with warning or down status, ensure some error logs
      if (service.status === 'WARNING' && Math.random() < 0.3) {
        level = 'WARNING';
      } else if (service.status === 'DOWN' && Math.random() < 0.5) {
        level = 'ERROR';
      }
      
      // Create log entry
      const logData: InsertLog = {
        serviceId,
        level,
        message
      };
      
      await storage.createLog(logData);
    }
    
    console.log(`Log collection completed for service ${serviceId}`);
    
  } catch (error) {
    console.error(`Error collecting logs for service ${serviceId}:`, error);
  }
}

// Schedule metrics collection for all services
export function scheduleMetricsCollection(intervalMs = 30000) {
  const intervalId = setInterval(async () => {
    try {
      // Get all services
      const services = await storage.getAllServices();
      
      // Collect metrics for each service
      for (const service of services) {
        // For development, add a delay between service metric collections
        // to avoid overwhelming the system
        setTimeout(() => {
          collectServiceMetrics(service.id, service.actuatorUrl);
        }, 500 * (service.id % 5)); // Stagger the metrics collection
      }
    } catch (error) {
      console.error('Error during scheduled metrics collection:', error);
    }
  }, intervalMs);
  
  return intervalId;
}
