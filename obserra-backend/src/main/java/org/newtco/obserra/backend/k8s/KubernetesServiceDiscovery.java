package org.newtco.obserra.backend.k8s;

import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.ApiException;
import io.kubernetes.client.openapi.Configuration;
import io.kubernetes.client.openapi.apis.CoreV1Api;
import io.kubernetes.client.openapi.models.V1Pod;
import io.kubernetes.client.openapi.models.V1PodList;
import io.kubernetes.client.openapi.models.V1Service;
import io.kubernetes.client.openapi.models.V1ServiceList;
import io.kubernetes.client.util.Config;
import org.newtco.obserra.backend.model.RegistrationSource;
import org.newtco.obserra.backend.model.Service;
import org.newtco.obserra.backend.model.ServiceStatus;
import org.newtco.obserra.backend.storage.Storage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service discovery for Kubernetes.
 * This class is responsible for discovering and registering Kubernetes services with Spring Boot actuator endpoints.
 */
@Component
public class KubernetesServiceDiscovery {

    private static final Logger logger = LoggerFactory.getLogger(KubernetesServiceDiscovery.class);

    private final Storage storage;
    private final boolean kubernetesEnabled;
    private final long discoveryIntervalMs;
    private CoreV1Api api;

    @Autowired
    public KubernetesServiceDiscovery(
            Storage storage,
            @Value("${obserra.service-discovery.kubernetes.enabled:false}") boolean kubernetesEnabled,
            @Value("${obserra.service-discovery.interval-ms:60000}") long discoveryIntervalMs) {
        this.storage = storage;
        this.kubernetesEnabled = kubernetesEnabled;
        this.discoveryIntervalMs = discoveryIntervalMs;
        
        if (kubernetesEnabled) {
            try {
                ApiClient client = Config.defaultClient();
                Configuration.setDefaultApiClient(client);
                this.api = new CoreV1Api();
                logger.info("Kubernetes client initialized");
            } catch (IOException e) {
                logger.error("Failed to initialize Kubernetes client", e);
            }
        }
    }

    /**
     * Initialize service discovery when the application is ready.
     * This method is called once when the application is fully started.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        logger.info("Application ready, starting initial service discovery");
        discoverServices();
    }

    /**
     * Scheduled service discovery.
     * This method is called periodically to discover new services.
     */
    @Scheduled(fixedDelayString = "${obserra.service-discovery.interval-ms:60000}")
    public void scheduledDiscovery() {
        if (kubernetesEnabled) {
            logger.debug("Running scheduled service discovery");
            discoverServices();
        }
    }

    /**
     * Discover Kubernetes services with Spring Boot actuator endpoints.
     */
    public void discoverServices() {
        if (!kubernetesEnabled || api == null) {
            logger.info("Kubernetes service discovery is disabled");
            return;
        }

        try {
            // Get all pods in all namespaces
            V1PodList podList = api.listPodForAllNamespaces(null, null, null, null, null, null, null, null, null, null);
            
            // Get all services in all namespaces
            V1ServiceList serviceList = api.listServiceForAllNamespaces(null, null, null, null, null, null, null, null, null, null);
            
            // Map services to pods
            for (V1Pod pod : podList.getItems()) {
                processPod(pod, serviceList);
            }
            
            logger.info("Service discovery completed, processed {} pods", podList.getItems().size());
        } catch (ApiException e) {
            logger.error("Failed to discover Kubernetes services: {}", e.getResponseBody(), e);
        }
    }

    /**
     * Process a Kubernetes pod to check if it has Spring Boot actuator endpoints.
     *
     * @param pod the Kubernetes pod to process
     * @param serviceList the list of Kubernetes services
     */
    private void processPod(V1Pod pod, V1ServiceList serviceList) {
        String podName = pod.getMetadata().getName();
        String namespace = pod.getMetadata().getNamespace();
        Map<String, String> labels = pod.getMetadata().getLabels();
        
        if (labels == null || labels.isEmpty()) {
            return;
        }
        
        // Check if this pod has the Spring Boot actuator label or other indicators
        boolean isSpringBoot = false;
        String appName = null;
        
        if (labels.containsKey("app")) {
            appName = labels.get("app");
            isSpringBoot = true; // Assume it's Spring Boot if it has an app label
        } else if (labels.containsKey("app.kubernetes.io/name")) {
            appName = labels.get("app.kubernetes.io/name");
            isSpringBoot = true; // Assume it's Spring Boot if it has an app.kubernetes.io/name label
        }
        
        if (!isSpringBoot || appName == null) {
            return;
        }
        
        // Find the service that targets this pod
        List<V1Service> matchingServices = findServicesForPod(pod, serviceList);
        
        if (matchingServices.isEmpty()) {
            logger.debug("No matching service found for pod {}", podName);
            return;
        }
        
        // For each matching service, try to register it
        for (V1Service k8sService : matchingServices) {
            registerService(pod, k8sService, appName);
        }
    }

    /**
     * Find Kubernetes services that target a specific pod.
     *
     * @param pod the Kubernetes pod
     * @param serviceList the list of Kubernetes services
     * @return a list of Kubernetes services that target the pod
     */
    private List<V1Service> findServicesForPod(V1Pod pod, V1ServiceList serviceList) {
        List<V1Service> matchingServices = new ArrayList<>();
        Map<String, String> podLabels = pod.getMetadata().getLabels();
        
        if (podLabels == null || podLabels.isEmpty()) {
            return matchingServices;
        }
        
        for (V1Service k8sService : serviceList.getItems()) {
            if (!pod.getMetadata().getNamespace().equals(k8sService.getMetadata().getNamespace())) {
                continue;
            }
            
            Map<String, String> selector = k8sService.getSpec().getSelector();
            if (selector == null || selector.isEmpty()) {
                continue;
            }
            
            boolean matches = true;
            for (Map.Entry<String, String> entry : selector.entrySet()) {
                String key = entry.getKey();
                String value = entry.getValue();
                
                if (!value.equals(podLabels.get(key))) {
                    matches = false;
                    break;
                }
            }
            
            if (matches) {
                matchingServices.add(k8sService);
            }
        }
        
        return matchingServices;
    }

    /**
     * Register a Kubernetes service with Spring Boot actuator endpoints.
     *
     * @param pod the Kubernetes pod
     * @param k8sService the Kubernetes service
     * @param appName the application name
     */
    private void registerService(V1Pod pod, V1Service k8sService, String appName) {
        String podName = pod.getMetadata().getName();
        String namespace = pod.getMetadata().getNamespace();
        String serviceName = k8sService.getMetadata().getName();
        
        // Check if this service is already registered
        Optional<Service> existingService = storage.getServiceByPodName(podName);
        
        if (existingService.isPresent()) {
            logger.debug("Service already registered for pod {}", podName);
            return;
        }
        
        // Construct the actuator URL
        String clusterDns = String.format("%s.%s.svc.cluster.local", serviceName, namespace);
        Integer port = k8sService.getSpec().getPorts().get(0).getPort();
        String actuatorUrl = String.format("http://%s:%d", clusterDns, port);
        
        // Create a new service
        Service service = new Service();
        service.setName(appName);
        service.setNamespace(namespace);
        service.setPodName(podName);
        service.setStatus(ServiceStatus.UNKNOWN);
        service.setClusterDns(clusterDns);
        service.setActuatorUrl(actuatorUrl);
        service.setRegistrationSource(RegistrationSource.KUBERNETES);
        service.setHealthCheckPath("/actuator/health");
        service.setMetricsPath("/actuator/metrics");
        service.setLogsPath("/actuator/logfile");
        service.setConfigPath("/actuator/env");
        
        // Register the service
        Service registeredService = storage.createService(service);
        logger.info("Registered new service: {} ({})", registeredService.getName(), registeredService.getPodName());
    }
}