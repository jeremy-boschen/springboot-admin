import { k8sClient } from './client';
import { InsertService, ServiceStatus } from '@shared/schema';
import { storage } from '../storage';
import { createActuatorClient } from '../actuator/client';
import config from '../config';

// Labels and annotations to identify Spring Boot services
const SPRING_BOOT_LABELS = [
  'app.kubernetes.io/part-of=spring-boot',
  'app=spring-boot',
  'spring-boot=true',
];

// Mock service data for development/demo
const MOCK_SERVICES = [
  {
    name: 'customer-service',
    namespace: 'app-services',
    podName: 'customer-service',
    version: '1.5.3',
    status: 'UP' as ServiceStatus,
    clusterDns: 'customer-service.app-services.svc.cluster.local',
    actuatorUrl: 'http://customer-service.app-services.svc.cluster.local:8080/actuator'
  },
  {
    name: 'order-service',
    namespace: 'app-services',
    podName: 'order-service',
    version: '1.2.1',
    status: 'UP' as ServiceStatus,
    clusterDns: 'order-service.app-services.svc.cluster.local',
    actuatorUrl: 'http://order-service.app-services.svc.cluster.local:8080/actuator'
  },
  {
    name: 'product-service',
    namespace: 'app-services',
    podName: 'product-service',
    version: '2.0.0',
    status: 'WARNING' as ServiceStatus,
    clusterDns: 'product-service.app-services.svc.cluster.local',
    actuatorUrl: 'http://product-service.app-services.svc.cluster.local:8080/actuator'
  },
  {
    name: 'payment-service',
    namespace: 'app-services',
    podName: 'payment-service',
    version: '1.0.5',
    status: 'DOWN' as ServiceStatus,
    clusterDns: 'payment-service.app-services.svc.cluster.local',
    actuatorUrl: 'http://payment-service.app-services.svc.cluster.local:8080/actuator'
  },
  {
    name: 'spring-boot-app-1',
    namespace: 'default',
    podName: 'spring-boot-app-1',
    version: '2.5.1',
    status: 'UP' as ServiceStatus,
    clusterDns: 'spring-boot-app-1.default.svc.cluster.local',
    actuatorUrl: 'http://spring-boot-app-1.default.svc.cluster.local:8080/actuator'
  },
  {
    name: 'spring-boot-app-2',
    namespace: 'default',
    podName: 'spring-boot-app-2',
    version: '2.5.1',
    status: 'UP' as ServiceStatus,
    clusterDns: 'spring-boot-app-2.default.svc.cluster.local',
    actuatorUrl: 'http://spring-boot-app-2.default.svc.cluster.local:8080/actuator'
  }
];

export async function discoverSpringBootServices() {
  // In development/demo mode, use mock data instead of real Kubernetes discovery
  const useMockData = true;
  
  try {
    console.log('Discovering Spring Boot services...');
    
    if (useMockData) {
      console.log('Using mock service data for development');
      await processMockServices();
      return;
    }
    
    // Production code path (not used in development mode)
    // Get all pods across all namespaces
    const pods = await k8sClient.listPods();
    
    // Filter pods that match Spring Boot criteria (labels or annotations)
    const springBootPods = pods.filter(pod => {
      const labels = pod.metadata?.labels || {};
      
      // Check if any of our target labels are present
      return SPRING_BOOT_LABELS.some(labelStr => {
        const [key, value] = labelStr.split('=');
        return labels[key] === value;
      });
    });
    
    console.log(`Found ${springBootPods.length} Spring Boot pods`);
    
    // Process each Spring Boot pod
    for (const pod of springBootPods) {
      await processDiscoveredPod(pod);
    }
    
    console.log('Service discovery completed');
    
  } catch (error) {
    console.error('Error during service discovery:', error);
    // Don't throw in development mode to avoid crashing the app
    if (!useMockData) {
      throw error;
    }
  }
}

// Process mock services for development/demo
async function processMockServices() {
  for (const mockService of MOCK_SERVICES) {
    try {
      // Check if this service is already in the database
      const existingService = await storage.getServiceByPodName(mockService.podName);
      
      if (existingService) {
        // Update existing service
        await storage.updateService(existingService.id, mockService);
      } else {
        // Create new service
        await storage.createService(mockService);
      }
      
      console.log(`Processed mock service ${mockService.name} with status ${mockService.status}`);
    } catch (error) {
      console.error(`Error processing mock service ${mockService.name}:`, error);
    }
  }
}

// Process a discovered pod (for production mode)
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
    const serviceData: InsertService = {
      name: pod.metadata?.labels?.['app.kubernetes.io/name'] || 
            pod.metadata?.labels?.['app'] || 
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
    const serviceData: InsertService = {
      name: pod.metadata?.labels?.['app.kubernetes.io/name'] || 
            pod.metadata?.labels?.['app'] || 
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

// Run service discovery on a schedule
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
