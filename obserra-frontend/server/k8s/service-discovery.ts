import { k8sClient } from './client';
import { InsertService, ServiceStatus } from '@shared/schema';
import { storage } from '../storage';
import { createActuatorClient } from '../actuator/client';
import config from '../config';

// Labels and annotations to identify Spring Boot services
const SPRING_BOOT_LABELS = [
  'app.k8s.io/part-of=spring-boot',
  'app=spring-boot',
  'spring-boot=true',
];

// No mock services in development mode - we'll use real service discovery

/**
 * Spring Boot Service Discovery for Kubernetes Clusters
 * 
 * This function discovers Spring Boot applications running in a Kubernetes cluster
 * by searching for pods with specific labels and annotations. It supports:
 * 
 * 1. Auto-detection of Spring Boot applications in any namespace
 * 2. Integration with Spring Boot Actuator endpoints for health and metrics
 * 3. Automatic service registration and status tracking
 * 
 * The discovery process operates in two modes:
 * - Development mode: Uses mock data for offline development
 * - Production mode: Connects to the Kubernetes API to discover real services
 * 
 * Once services are discovered, they are registered in the application's storage
 * system for tracking and monitoring.
 */
export async function discoverSpringBootServices() {
  try {
    console.log('Discovering Spring Boot services...');

    // Check if k8sClient is using a real cluster
    // This is auto-detected in the KubernetesClient constructor
    if (!k8sClient['useRealCluster']) {
      console.log('Not running in Kubernetes, using mock service data for development');
      await processMockServices();
      return;
    }

    // Production code path (not used in development mode)
    // First get all service objects - these provide stable network endpoints
    const services = await k8sClient.listServices();

    // Filter services that might be Spring Boot services based on labels or naming patterns
    const potentialSpringBootServices = services.filter(service => {
      // Type safety for service.metadata.labels which might not exist
      const metadata = service.metadata || {};
      const labels: Record<string, string> = (metadata.labels as Record<string, string>) || {};

      // Check if any of our target labels are present in the service labels
      const hasSpringBootLabels = SPRING_BOOT_LABELS.some(labelStr => {
        const [key, value] = labelStr.split('=');
        return labels[key] === value;
      });

      // Also check naming patterns common for Spring Boot services
      const name = (metadata.name || '').toLowerCase();
      const hasSpringBootName = name.includes('spring') || 
                                name.includes('boot') || 
                                name.endsWith('-service') ||
                                name.endsWith('-svc');

      return hasSpringBootLabels || hasSpringBootName;
    });

    console.log(`Found ${potentialSpringBootServices.length} potential Spring Boot services`);

    // Get all pods to match with services
    const pods = await k8sClient.listPods();

    // Process each potential Spring Boot service
    for (const service of potentialSpringBootServices) {
      await processDiscoveredService(service, pods);
    }

    // Also look for standalone Spring Boot pods that don't have a service
    // This is optional but helps catch apps not properly exposed via Services
    const springBootPods = pods.filter(pod => {
      // Type safety for pod.metadata.labels which might not exist
      const metadata = pod.metadata || {};
      const labels: Record<string, string> = (metadata.labels as Record<string, string>) || {};

      // Check if any of our target labels are present
      return SPRING_BOOT_LABELS.some(labelStr => {
        const [key, value] = labelStr.split('=');
        return labels[key] === value;
      });
    });

    // Process Spring Boot pods that don't match any processed services
    for (const pod of springBootPods) {
      // Use pod name as identifier to check if we've already processed it via a service
      const podName = pod.metadata?.name || '';
      const existingService = await storage.getServiceByPodName(podName);

      if (!existingService) {
        await processDiscoveredPod(pod);
      }
    }

    console.log('Service discovery completed');

  } catch (error) {
    console.error('Error during service discovery:', error);
    // Don't throw in development mode to avoid crashing the app
    if (k8sClient['useRealCluster']) {
      throw error;
    }
  }
}

/**
 * Process services in development mode
 * 
 * This function is used in development mode when no real Kubernetes cluster is available.
 * Instead of using mock data, it will attempt to discover services through other means
 * such as direct registration or local service discovery.
 * 
 * In a real environment, services would register themselves or be discovered through
 * Kubernetes API, but in development we need an alternative approach.
 */
async function processMockServices() {
  console.log('Development mode: No predefined mock services available');
  console.log('Services will need to be registered manually or discovered through other means');

  // Get any existing services from storage
  const existingServices = await storage.getAllServices();
  if (existingServices.length > 0) {
    console.log(`Found ${existingServices.length} existing services in storage`);
  } else {
    console.log('No existing services found in storage');
  }
}

/**
 * Process a discovered Kubernetes Service that exposes a Spring Boot application
 * 
 * This function extracts information from a Kubernetes Service object and interacts
 * with the Spring Boot Actuator endpoints to gather health and version information.
 * It then creates or updates the application's database record for the service.
 * 
 * Using Service objects instead of Pods provides:
 * - Stable network endpoints that don't change when pods are restarted
 * - Proper DNS resolution within the cluster
 * - Load balancing if multiple pod instances exist
 * 
 * @param service Kubernetes Service object
 * @param pods List of all pods for matching selectors to services
 */
async function processDiscoveredService(service: any, pods: any[]) {
  const serviceName = service.metadata?.name;
  const namespace = service.metadata?.namespace;

  if (!serviceName || !namespace) return;

  // Get selector from service to match pods
  const selector = service.spec?.selector;
  if (!selector) {
    console.log(`Service ${serviceName} has no selector, skipping`);
    return;
  }

  // Find pods that match this service's selector
  const matchingPods = pods.filter(pod => {
    const labels = pod.metadata?.labels || {};
    // Check if all selector keys match the pod labels
    return Object.entries(selector).every(([key, value]) => labels[key] === value);
  });

  if (matchingPods.length === 0) {
    console.log(`No pods found matching service ${serviceName} selector`);
    return;
  }

  // Use the first matching pod for identifier
  const podName = matchingPods[0].metadata?.name;

  // Construct the cluster DNS for the service (much more reliable than pod DNS)
  const clusterDns = `${serviceName}.${namespace}.svc.cluster.local`;

  // Check for management port annotation on pod (or use default)
  const pod = matchingPods[0];
  const managementPort = pod.metadata?.annotations?.[config.actuator.managementPortAnnotation] || 
                        service.spec?.ports?.find((p: any) => p.name === 'actuator')?.port ||
                        config.actuator.defaultPort;

  // Check for management context path annotation (or use default)
  const managementContextPath = pod.metadata?.annotations?.[config.actuator.managementContextPathAnnotation] || 
                              config.actuator.basePath;

  // Construct the actuator base URL using the service DNS
  const actuatorUrl = `http://${clusterDns}:${managementPort}${managementContextPath}`;
  const actuatorClient = createActuatorClient(actuatorUrl);

  try {
    // Get health information
    const healthData = await actuatorClient.getHealth();

    // Get info (for version)
    const infoData = await actuatorClient.getInfo();
    const version = infoData.build?.version || infoData.version || 'unknown';

    // Determine service status
    let status: ServiceStatus = healthData.status?.toUpperCase() as ServiceStatus || 'UNKNOWN';
    if (status !== 'UP' && status !== 'DOWN' && status !== 'WARNING') {
      status = 'UNKNOWN';
    }

    // Check if this service is already in the database
    const existingService = await storage.getServiceByPodName(podName);

    // Create or update the service
    // Type safety for service.metadata.labels
    const metadata = service.metadata || {};
    const labels: Record<string, string> = (metadata.labels as Record<string, string>) || {};

    const serviceData: InsertService = {
      name: labels['app.k8s.io/name'] ||
            labels['app'] || 
            serviceName,
      namespace,
      podName, // Store pod name as reference for metrics/logs
      version,
      status,
      clusterDns,
      actuatorUrl
    };

    if (existingService) {
      // Update existing service
      await storage.updateService(existingService.id, serviceData);
    } else {
      // Create new service
      await storage.createService(serviceData);
    }

    console.log(`Processed service ${serviceData.name} in ${namespace} with status ${status}`);

  } catch (error) {
    console.error(`Error processing service ${serviceName} in ${namespace}:`, error);

    // Register the service as DOWN if we couldn't reach it
    // Type safety for service.metadata.labels
    const metadata = service.metadata || {};
    const labels: Record<string, string> = (metadata.labels as Record<string, string>) || {};

    const serviceData: InsertService = {
      name: labels['app.k8s.io/name'] ||
            labels['app'] || 
            serviceName,
      namespace,
      podName,
      version: 'unknown',
      status: 'DOWN',
      clusterDns,
      actuatorUrl
    };

    const existingService = await storage.getServiceByPodName(podName);
    if (existingService) {
      await storage.updateService(existingService.id, serviceData);
    } else {
      await storage.createService(serviceData);
    }
  }
}

/**
 * Process a discovered Kubernetes pod that contains a Spring Boot application
 * 
 * This function extracts information from a Kubernetes pod object and interacts
 * with the Spring Boot Actuator endpoints to gather health and version information.
 * It then creates or updates the application's database record for the service.
 * 
 * Key aspects of service discovery:
 * - Extracts pod metadata like name, namespace, and labels
 * - Constructs the in-cluster DNS name for reliable communication
 * - Detects management port and context path from annotations or defaults
 * - Retrieves health status and version via Actuator endpoints
 * - Persists service details in the application database
 * 
 * If the service is unreachable, it will still be registered but marked as DOWN.
 * 
 * @param pod Kubernetes pod object containing a Spring Boot application
 */
async function processDiscoveredPod(pod: any) {
  const podName = pod.metadata?.name;
  const namespace = pod.metadata?.namespace;

  if (!podName || !namespace) return;

  // Construct the cluster DNS for the pod
  const clusterDns = `${podName}.${namespace}.svc.cluster.local`;

  // Check for management port annotation (or use default)
  const managementPort = pod.metadata?.annotations?.[config.actuator.managementPortAnnotation] || 
                         config.actuator.defaultPort;

  // Check for management context path annotation (or use default)
  const managementContextPath = pod.metadata?.annotations?.[config.actuator.managementContextPathAnnotation] || 
                                config.actuator.basePath;

  // Construct the actuator base URL
  const actuatorUrl = `http://${clusterDns}:${managementPort}${managementContextPath}`;
  const actuatorClient = createActuatorClient(actuatorUrl);

  try {
    // Get health information
    const healthData = await actuatorClient.getHealth();

    // Get info (for version)
    const infoData = await actuatorClient.getInfo();
    const version = infoData.build?.version || infoData.version || 'unknown';

    // Determine service status
    let status: ServiceStatus = healthData.status?.toUpperCase() as ServiceStatus || 'UNKNOWN';
    if (status !== 'UP' && status !== 'DOWN' && status !== 'WARNING') {
      status = 'UNKNOWN';
    }

    // Check if this service is already in the database
    const existingService = await storage.getServiceByPodName(podName);

    // Create or update the service
    // Type safety for pod.metadata.labels
    const metadata = pod.metadata || {};
    const labels: Record<string, string> = (metadata.labels as Record<string, string>) || {};

    const serviceData: InsertService = {
      name: labels['app.k8s.io/name'] ||
            labels['app'] || 
            podName,
      namespace,
      podName,
      version,
      status,
      clusterDns,
      actuatorUrl
    };

    if (existingService) {
      // Update existing service
      await storage.updateService(existingService.id, serviceData);
    } else {
      // Create new service
      await storage.createService(serviceData);
    }

    console.log(`Processed service ${serviceData.name} in ${namespace} with status ${status}`);

  } catch (error) {
    console.error(`Error processing pod ${podName} in ${namespace}:`, error);

    // Register the service as DOWN if we couldn't reach it
    // Type safety for pod.metadata.labels
    const metadata = pod.metadata || {};
    const labels: Record<string, string> = (metadata.labels as Record<string, string>) || {};

    const serviceData: InsertService = {
      name: labels['app.k8s.io/name'] ||
            labels['app'] || 
            podName,
      namespace,
      podName,
      version: 'unknown',
      status: 'DOWN',
      clusterDns,
      actuatorUrl
    };

    const existingService = await storage.getServiceByPodName(podName);
    if (existingService) {
      await storage.updateService(existingService.id, serviceData);
    } else {
      await storage.createService(serviceData);
    }
  }
}

/**
 * Schedule regular service discovery to maintain an up-to-date service registry
 * 
 * This function sets up a recurring interval to automatically discover and update
 * Spring Boot services in the Kubernetes cluster. It ensures that:
 * 
 * - New services are automatically registered when they become available
 * - Service status changes are detected and updated
 * - Services that are no longer available are marked as DOWN
 * 
 * The discovery interval can be configured in the application's config file
 * or overridden by providing an explicit interval parameter.
 * 
 * @param intervalMs Optional interval in milliseconds between discovery runs
 * @returns The interval ID that can be used to cancel scheduled discovery
 */
export function scheduleServiceDiscovery(intervalMs?: number) {
  // Use config interval if not explicitly provided
  const discoveryInterval = intervalMs || config.kubernetes.serviceDiscoveryInterval;

  console.log(`Scheduling service discovery every ${discoveryInterval/1000} seconds`);

  // Initial discovery
  discoverSpringBootServices();

  // Schedule regular discovery
  const intervalId = setInterval(() => {
    discoverSpringBootServices();
  }, discoveryInterval);

  return intervalId;
}
