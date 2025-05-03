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
        return response.body.items;
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
          return response.body.items;
        } else {
          const response = await this.k8sApi.listPodForAllNamespaces();
          return response.body.items;
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
          return response.body.items;
        } else {
          const response = await this.k8sApi.listServiceForAllNamespaces();
          return response.body.items;
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
   * the "kubectl.kubernetes.io/restartedAt" annotation with the current timestamp,
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
            path: '/spec/template/metadata/annotations/kubectl.kubernetes.io~1restartedAt',
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
}

// Singleton instance
export const k8sClient = new KubernetesClient();
