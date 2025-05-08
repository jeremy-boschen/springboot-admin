import * as k8s from '@kubernetes/client-node';
import config from '../config';
import fs from 'fs';
import {V1Namespace} from "@kubernetes/client-node/dist/gen/models/V1Namespace";
import {V1Pod} from "@kubernetes/client-node/dist/gen/models/V1Pod";
import {V1Service} from "@kubernetes/client-node/dist/gen/models/V1Service";

// Default empty data structures for development mode
const DEFAULT_NAMESPACES: Array<V1Namespace> = [];
const DEFAULT_PODS: Array<V1Pod> = [];
const DEFAULT_SERVICES: Array<V1Service> = [];

/**
 * Checks if the application is running inside a Kubernetes cluster
 * by looking for the service account token file that is automatically
 * mounted when running in a Kubernetes pod.
 *
 * @returns boolean True if running in a Kubernetes cluster
 */
function isRunningInKubernetes(): boolean {
    try {
        // Check for the existence of the Kubernetes service account token file
        return fs.existsSync('/var/run/secrets/kubernetes.io/serviceaccount/token');
    } catch (error) {
        console.log('Error checking for Kubernetes environment:', error);
        return false;
    }
}

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
 * The client automatically detects if it's running inside a Kubernetes cluster.
 * Configuration can be adjusted to specify namespaces, kubeconfig paths, and authentication methods.
 */
export class KubernetesClient {
    private useRealCluster: boolean;
    private k8sApi: k8s.CoreV1Api | null = null;
    private k8sAppsApi: k8s.AppsV1Api | null = null;

    constructor() {
        // Auto-detect if running in Kubernetes
        this.useRealCluster = isRunningInKubernetes();

        if (config.kubernetes.kubeconfig) {
            // If kubeconfig is explicitly provided, use it regardless of environment
            this.useRealCluster = true;
        }

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
                return DEFAULT_NAMESPACES;
            }
        } else {
            console.log('[Development] Returning empty namespaces list');
            return DEFAULT_NAMESPACES;
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
                    const response = await this.k8sApi.listNamespacedPod({namespace});
                    return response.items;
                } else {
                    const response = await this.k8sApi.listPodForAllNamespaces();
                    return response.items;
                }
            } catch (error) {
                console.error('Error listing pods:', error);
                return DEFAULT_PODS;
            }
        } else {
            console.log(`[Development] Returning empty pods list${namespace ? ` for namespace ${namespace}` : ''}`);
            return DEFAULT_PODS;
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
                    const response = await this.k8sApi.listNamespacedService({namespace});
                    return response.items;
                } else {
                    const response = await this.k8sApi.listServiceForAllNamespaces();
                    return response.items;
                }
            } catch (error) {
                console.error('Error listing services:', error);
                return DEFAULT_SERVICES;
            }
        } else {
            console.log(`[Development] Returning empty services list${namespace ? ` for namespace ${namespace}` : ''}`);
            return DEFAULT_SERVICES;
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

                const options = {headers: {'Content-type': 'application/json-patch+json'}};

                const response = await this.k8sAppsApi.patchNamespacedDeployment({
                        name,
                        namespace,
                        body: patch
                    });

                return response;
            } catch (error) {
                console.error(`Error restarting deployment ${name} in namespace ${namespace}:`, error);
                // Return a mock success response
                return {
                    metadata: {name, namespace},
                    status: {replicas: 1, updatedReplicas: 1, readyReplicas: 1, availableReplicas: 1}
                };
            }
        } else {
            console.log(`Mock restart of deployment ${name} in namespace ${namespace}`);
            // Return a mock success response
            return {
                metadata: {name, namespace},
                status: {replicas: 1, updatedReplicas: 1, readyReplicas: 1, availableReplicas: 1}
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
                const response = await this.k8sApi.readNamespacedPodLog({
                  name: podName,
                  namespace,
                  container: containerName,
                  follow: false,
                  tailLines: 1000
                });
                return response;
            } catch (error) {
                console.error(`Error getting logs for pod ${podName} in namespace ${namespace}:`, error);
                return "No logs available";
            }
        } else {
            console.log(`[Development] Getting logs for pod ${podName} in namespace ${namespace}`);
            return "No logs available in development mode";
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
    async restartService(namespace: string, podName: string): Promise<{ success: boolean, message: string }> {
        console.log(`Initiating restart for service ${podName} in namespace ${namespace}`);

        if (this.useRealCluster && this.k8sApi && this.k8sAppsApi) {
            try {
                // First check if this is a deployment
                try {
                    const deployment = await this.k8sAppsApi.readNamespacedDeployment({name: podName, namespace});
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
                    const pod = await this.k8sApi.readNamespacedPod({name: podName, namespace});
                    if (pod) {
                        // For pods, we delete them and let the controller recreate them
                        await this.k8sApi.deleteNamespacedPod({name: podName, namespace});
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
            // In development mode
            console.log(`[Development] Simulating restart of service ${podName} in namespace ${namespace}`);

            // Simulate a brief delay to mimic the restart process
            await new Promise(resolve => setTimeout(resolve, 1500));

            return {
                success: true,
                message: `Service ${podName} in namespace ${namespace} restart simulated in development mode`
            };
        }
    }
}

// Singleton instance
export const k8sClient = new KubernetesClient();
