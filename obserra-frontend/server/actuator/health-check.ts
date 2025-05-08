import axios from 'axios';
import { Service, ServiceStatus } from '../../shared/schema';
import { storage } from '../storage';
import config from '../config';

/**
 * Spring Boot Actuator Health Check Module
 * 
 * This module provides functionality to check the health status of registered
 * Spring Boot applications through their Actuator health endpoints. It supports:
 * 
 * - Checking health status of individual services
 * - Scheduled health checks for all registered services
 * - Status updates based on health check results
 * 
 * The health checks use the standard Spring Boot Actuator health endpoint and
 * follow the same status conventions: UP, DOWN, WARNING, and UNKNOWN.
 */

/**
 * Checks the health of a Spring Boot application through its Actuator health endpoint
 * 
 * @param service The service to check
 * @returns The health status of the service: UP, DOWN, WARNING, or UNKNOWN
 */
export async function checkActuatorHealth(service: Service): Promise<ServiceStatus> {
  try {
    // Construct the health check URL
    const healthUrl = service.actuatorUrl + (service.healthCheckPath || '/health');
    
    // Set a timeout for the health check request
    const requestTimeout = config.healthCheck?.timeoutMs || 5000;
    
    // Make the health check request
    const response = await axios.get(healthUrl, { 
      timeout: requestTimeout,
      validateStatus: () => true // Accept any status code to handle different actuator configurations
    });
    
    // If the request failed with a network error, the service is DOWN
    if (response.status !== 200) {
      return 'DOWN';
    }
    
    // Parse the health data
    const healthData = response.data;
    
    // Handle Spring Boot 2.x and 3.x health output format
    const status = healthData.status?.toLowerCase() || 'unknown';
    
    // Map Spring Boot health status to our service status enum
    if (status === 'up') {
      return 'UP';
    } else if (status === 'down') {
      return 'DOWN';
    } else if (status === 'warning' || status === 'unknown') {
      return 'WARNING';
    } else {
      return 'UNKNOWN';
    }
  } catch (error) {
    console.error(`Health check failed for service ${service.id}:`, error);
    return 'DOWN';
  }
}

/**
 * Performs health checks on all services that are due for checking
 * 
 * @param maxAge Maximum age in seconds since the last health check
 * @returns Number of services checked
 */
export async function performHealthChecks(maxAge: number = 60): Promise<number> {
  try {
    // Get all services that need a health check based on their last check time
    const services = await storage.getServicesForHealthCheck(maxAge);
    
    if (services.length === 0) {
      return 0;
    }
    
    console.log(`Performing health checks on ${services.length} services`);
    
    // Check the health of each service
    let checkedCount = 0;
    
    for (const service of services) {
      try {
        // Check the status
        const status = await checkActuatorHealth(service);
        
        // Update the service status and last seen timestamp
        await storage.updateServiceStatus(service.id, status);
        await storage.updateServiceLastSeen(service.id);
        
        console.log(`Processed service ${service.name} in ${service.namespace || 'default'} with status ${status}`);
        checkedCount++;
      } catch (error) {
        console.error(`Failed to process health check for service ${service.id}:`, error);
      }
    }
    
    console.log(`Service discovery completed`);
    return checkedCount;
  } catch (error) {
    console.error('Error performing health checks:', error);
    return 0;
  }
}

/**
 * Set up scheduled health checks for all registered services
 * 
 * @param intervalMs Interval in milliseconds between health check runs
 * @returns The interval ID
 */
export function scheduleHealthChecks(intervalMs: number = 30000): NodeJS.Timeout {
  console.log(`Scheduling health checks every ${intervalMs}ms`);
  
  // Get the health check interval in seconds
  const healthCheckInterval = config.healthCheck?.retryDelayMs || 5;
  
  // Set up the interval for health checks
  return setInterval(async () => {
    await performHealthChecks(healthCheckInterval);
  }, intervalMs);
}