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

import axios from 'axios';
import { Service, ServiceStatus } from '@shared/schema';
import { storage } from '../storage';
import config from '../config';

/**
 * Checks the health of a Spring Boot application through its Actuator health endpoint
 * 
 * @param service The service to check
 * @returns The health status of the service: UP, DOWN, WARNING, or UNKNOWN
 */
export async function checkActuatorHealth(service: Service): Promise<ServiceStatus> {
  try {
    // Construct the health endpoint URL
    const healthPath = service.healthCheckPath || '/actuator/health';
    const url = `${service.actuatorUrl}${healthPath}`;
    
    // Make the request with a timeout
    const response = await axios.get(url, { 
      timeout: 5000,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    // Parse the health status
    if (response.data && response.data.status) {
      const status = response.data.status.toUpperCase();
      if (status === 'UP' || status === 'DOWN' || status === 'WARNING') {
        return status as ServiceStatus;
      }
    }
    
    return 'UNKNOWN';
  } catch (error) {
    console.error(`Health check failed for service ${service.name}:`, error);
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
  // Get services that need to be checked
  const services = await storage.getServicesForHealthCheck(maxAge);
  
  console.log(`Performing health checks on ${services.length} services`);
  
  for (const service of services) {
    try {
      // Check health
      const status = await checkActuatorHealth(service);
      
      // Update service status
      if (status !== service.status) {
        await storage.updateServiceStatus(service.id, status);
      }
      
      // Update last seen timestamp
      await storage.updateServiceLastSeen(service.id);
      
      console.log(`Health check for ${service.name}: ${status}`);
    } catch (error) {
      console.error(`Error checking health for service ${service.name}:`, error);
    }
  }
  
  return services.length;
}

/**
 * Set up scheduled health checks for all registered services
 * 
 * @param intervalMs Interval in milliseconds between health check runs
 * @returns The interval ID
 */
export function scheduleHealthChecks(intervalMs: number = 30000): NodeJS.Timeout {
  console.log(`Scheduling health checks every ${intervalMs/1000} seconds`);
  
  // Initial health check
  performHealthChecks();
  
  // Schedule regular health checks
  const intervalId = setInterval(() => {
    performHealthChecks();
  }, intervalMs);
  
  return intervalId;
}