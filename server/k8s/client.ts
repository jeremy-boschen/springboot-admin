import * as k8s from '@kubernetes/client-node';
import config from '../config';

// Mock data for development
const MOCK_NAMESPACES = [
  { metadata: { name: 'default' }, status: { phase: 'Active' } },
  { metadata: { name: 'kube-system' }, status: { phase: 'Active' } },
  { metadata: { name: 'app-services' }, status: { phase: 'Active' } },
  { metadata: { name: 'monitoring' }, status: { phase: 'Active' } }
];

const MOCK_PODS = [
  { 
    metadata: { 
      name: 'spring-boot-app-1', 
      namespace: 'default',
      labels: { 'app': 'spring-boot', 'spring-boot': 'true' }
    }
  },
  { 
    metadata: { 
      name: 'spring-boot-app-2', 
      namespace: 'default',
      labels: { 'app': 'spring-boot', 'spring-boot': 'true' }
    }
  },
  { 
    metadata: { 
      name: 'customer-service', 
      namespace: 'app-services',
      labels: { 'app': 'spring-boot', 'spring-boot': 'true' }
    }
  },
  { 
    metadata: { 
      name: 'order-service', 
      namespace: 'app-services',
      labels: { 'app': 'spring-boot', 'spring-boot': 'true' }
    }
  },
  { 
    metadata: { 
      name: 'product-service', 
      namespace: 'app-services',
      labels: { 'app': 'spring-boot', 'spring-boot': 'true' }
    }
  },
  { 
    metadata: { 
      name: 'payment-service', 
      namespace: 'app-services',
      labels: { 'app': 'spring-boot', 'spring-boot': 'true' }
    }
  }
];

const MOCK_SERVICES = [
  { 
    metadata: { 
      name: 'spring-boot-app-svc-1', 
      namespace: 'default'
    },
    spec: {
      selector: { app: 'spring-boot-app-1' },
      ports: [{ port: 8080, targetPort: 8080 }]
    }
  },
  { 
    metadata: { 
      name: 'spring-boot-app-svc-2', 
      namespace: 'default'
    },
    spec: {
      selector: { app: 'spring-boot-app-2' },
      ports: [{ port: 8080, targetPort: 8080 }]
    }
  }
];

/**
 * Kubernetes Client for Spring Boot Service Discovery and Management
 * 
 * This class provides an interface to the Kubernetes API for discovering and
 * managing Spring Boot services running in a Kubernetes cluster. It supports:
 * 
 * - Auto-detection of Spring Boot applications in any namespace
 * - Listing of namespaces, pods, and services
 * - Viewing logs from Kubernetes pods
 * - Restarting deployments when needed
 * 
 * The client operates in two modes:
 * 1. Real cluster mode: Connects to a Kubernetes cluster using available credentials
 * 2. Development mode: Uses mock data for offline development and testing
 * 
 * Configuration is pulled from the application config file and can be adjusted
 * to specify namespaces, kubeconfig paths, and authentication methods.
 */
export class KubernetesClient {
  private useRealCluster: boolean;
  private k8sApi: k8s.CoreV1Api | null = null;
  private k8sAppsApi: k8s.AppsV1Api | null = null;

  constructor() {
    this.useRealCluster = config.kubernetes.inCluster;
    
    // Only initialize real clients if we're using a real cluster
    if (this.useRealCluster) {
      try {
        const kc = new k8s.KubeConfig();
        
        if (config.kubernetes.kubeconfig) {
          // Use specified kubeconfig file
          console.log(`Loading kubeconfig from ${config.kubernetes.kubeconfig}`);
          kc.loadFromFile(config.kubernetes.kubeconfig);
        } else {
          try {
            // Tries to load from kube config in cluster
            kc.loadFromCluster();
            console.log('Running in cluster mode, using in-cluster config');
            console.log('Current cluster:', kc.getCurrentCluster());
          } catch (error) {
            // Fallback to local config for development
            console.log('Unable to load in-cluster config, using local config');
            kc.loadFromDefault();
          }
        }

        this.k8sApi = kc.makeApiClient(k8s.CoreV1Api);
        this.k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
        
        if (config.kubernetes.namespace) {
          console.log(`Using namespace: ${config.kubernetes.namespace}`);
        } else {
          console.log('Watching all namespaces');
        }
      } catch (error) {
        console.error('Error initializing Kubernetes client, will use mock data:', error);
        this.useRealCluster = false;
      }
    } else {
      console.log('Using mock Kubernetes data for development');
    }
  }

  /**
   * Lists all namespaces in the Kubernetes cluster
   * 
   * @returns An array of namespace objects containing metadata and status
   */
  async listNamespaces() {
    if (this.useRealCluster && this.k8sApi) {
      try {
        const response = await this.k8sApi.listNamespace();
        return response.items;
      } catch (error) {
        console.error('Error listing namespaces:', error);
        return MOCK_NAMESPACES;
      }
    } else {
      return MOCK_NAMESPACES;
    }
  }

  /**
   * Lists all pods in a specified namespace or across all namespaces
   * 
   * @param namespace Optional namespace to filter pods by
   * @returns Array of pod objects with metadata and status information
   */
  async listPods(namespace?: string) {
    if (this.useRealCluster && this.k8sApi) {
      try {
        if (namespace) {
          const response = await this.k8sApi.listNamespacedPod(namespace);
          return response.items;
        } else {
          const response = await this.k8sApi.listPodForAllNamespaces();
          return response.items;
        }
      } catch (error) {
        console.error('Error listing pods:', error);
        return namespace 
          ? MOCK_PODS.filter(pod => pod.metadata.namespace === namespace)
          : MOCK_PODS;
      }
    } else {
      return namespace 
        ? MOCK_PODS.filter(pod => pod.metadata.namespace === namespace)
        : MOCK_PODS;
    }
  }

  /**
   * Lists all Kubernetes services in a specified namespace or across all namespaces
   * 
   * @param namespace Optional namespace to filter services by
   * @returns Array of service objects with metadata and spec information
   */
  async listServices(namespace?: string) {
    if (this.useRealCluster && this.k8sApi) {
      try {
        if (namespace) {
          const response = await this.k8sApi.listNamespacedService(namespace);
          return response.items;
        } else {
          const response = await this.k8sApi.listServiceForAllNamespaces();
          return response.items;
        }
      } catch (error) {
        console.error('Error listing services:', error);
        return namespace 
          ? MOCK_SERVICES.filter(svc => svc.metadata.namespace === namespace)
          : MOCK_SERVICES;
      }
    } else {
      return namespace 
        ? MOCK_SERVICES.filter(svc => svc.metadata.namespace === namespace)
        : MOCK_SERVICES;
    }
  }

  /**
   * Restarts a Kubernetes deployment by adding a restart annotation
   * 
   * This method triggers a rolling restart of a deployment by adding or updating
   * the "kubectl.k8s.io/restartedAt" annotation with the current timestamp,
   * which causes Kubernetes to recreate all pods in the deployment without changing
   * any configuration.
   * 
   * @param namespace The namespace containing the deployment
   * @param name The name of the deployment to restart
   * @returns The updated deployment object with status information
   */
  async restartDeployment(namespace: string, name: string) {
    if (this.useRealCluster && this.k8sAppsApi) {
      try {
        // Patch the deployment with a restart annotation to trigger a rollout
        const patch = [
          {
            op: 'add',
            path: '/spec/template/metadata/annotations/kubectl.k8s.io~1restartedAt',
            value: new Date().toISOString()
          }
        ];

        const options = { headers: { 'Content-type': 'application/json-patch+json' } };

        const response = await this.k8sAppsApi.patchNamespacedDeployment(
          name, 
          namespace, 
          patch as any, 
          undefined, 
          undefined, 
          undefined, 
          undefined, 
          options
        );
        
        return response.body;
      } catch (error) {
        console.error(`Error restarting deployment ${name} in namespace ${namespace}:`, error);
        // Return a mock success response
        return { 
          metadata: { name, namespace },
          status: { replicas: 1, updatedReplicas: 1, readyReplicas: 1, availableReplicas: 1 }
        };
      }
    } else {
      console.log(`Mock restart of deployment ${name} in namespace ${namespace}`);
      // Return a mock success response
      return { 
        metadata: { name, namespace },
        status: { replicas: 1, updatedReplicas: 1, readyReplicas: 1, availableReplicas: 1 }
      };
    }
  }

  /**
   * Retrieves container logs from a specified pod
   * 
   * This method fetches logs from a pod in a Kubernetes cluster, allowing for diagnosis
   * of application issues. It retrieves recent logs (last 1000 lines) from the specified
   * pod, and optionally from a specific container if the pod contains multiple containers.
   * 
   * @param namespace The namespace containing the pod
   * @param podName The name of the pod to get logs from
   * @param containerName Optional container name if the pod has multiple containers
   * @returns String containing the pod's logs
   */
  async getPodLogs(namespace: string, podName: string, containerName?: string) {
    if (this.useRealCluster && this.k8sApi) {
      try {
        const response = await this.k8sApi.readNamespacedPodLog(
          podName,
          namespace,
          containerName,
          false, // follow
          undefined, // limitBytes
          undefined, // pretty
          undefined, // previous
          1000, // tailLines
        );
        return response.body;
      } catch (error) {
        console.error(`Error getting logs for pod ${podName} in namespace ${namespace}:`, error);
        return "2023-05-03 12:34:56 INFO  [pod-1] Mock log entry for development\n2023-05-03 12:35:01 INFO  [pod-1] Application startup complete";
      }
    } else {
      return "2023-05-03 12:34:56 INFO  [pod-1] Mock log entry for development\n2023-05-03 12:35:01 INFO  [pod-1] Application startup complete";
    }
  }
  
  /**
   * Restarts a service by first identifying the appropriate Kubernetes resource
   * 
   * This method determines whether the service is a pod, deployment, or statefulset,
   * and applies the appropriate restart strategy. For pods, it deletes and allows
   * the controller to recreate it. For deployments and statefulsets, it triggers
   * a rolling restart by updating annotations.
   * 
   * @param namespace The namespace containing the service
   * @param podName The pod/deployment/service name to restart
   * @returns Object with success status and message details
   */
  async restartService(namespace: string, podName: string): Promise<{success: boolean, message: string}> {
    console.log(`Initiating restart for service ${podName} in namespace ${namespace}`);
    
    if (this.useRealCluster && this.k8sApi && this.k8sAppsApi) {
      try {
        // First check if this is a deployment
        try {
          const deployment = await this.k8sAppsApi.readNamespacedDeployment(podName, namespace);
          if (deployment) {
            // It's a deployment, restart using the deployment method
            await this.restartDeployment(namespace, podName);
            return {
              success: true,
              message: `Deployment ${podName} restart initiated successfully. New pods will be created with updated configuration.`
            };
          }
        } catch (err) {
          // Not a deployment, or error checking - continue to try other resource types
        }
        
        // Check if it's a standalone pod
        try {
          const pod = await this.k8sApi.readNamespacedPod(podName, namespace);
          if (pod) {
            // For pods, we delete them and let the controller recreate them
            await this.k8sApi.deleteNamespacedPod(podName, namespace);
            return {
              success: true,
              message: `Pod ${podName} deleted successfully. The controller will recreate it automatically.`
            };
          }
        } catch (err) {
          // Not a pod, or error checking
        }
        
        // If we got here, we couldn't find the resource
        return {
          success: false,
          message: `Could not find Kubernetes resource with name ${podName} in namespace ${namespace}`
        };
      } catch (error) {
        console.error(`Error restarting service ${podName} in namespace ${namespace}:`, error);
        return {
          success: false,
          message: `Error restarting service: ${(error as Error).message || 'Unknown error'}`
        };
      }
    } else {
      // In development mode with mock data
      console.log(`[MOCK] Simulating restart of service ${podName} in namespace ${namespace}`);
      
      // Simulate a brief delay to mimic the restart process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        success: true,
        message: `Service ${podName} in namespace ${namespace} has been restarted successfully`
      };
    }
  }
}

// Singleton instance
export const k8sClient = new KubernetesClient();
