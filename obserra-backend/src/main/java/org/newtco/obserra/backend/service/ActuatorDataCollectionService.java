package org.newtco.obserra.backend.service;

import org.newtco.obserra.backend.collector.ActuatorEndpointCollector;
import org.newtco.obserra.backend.model.ActuatorEndpoint;
import org.newtco.obserra.backend.model.Service;
import org.newtco.obserra.backend.storage.Storage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Service for collecting data from actuator endpoints.
 * This service uses the registered collectors to collect data from the discovered actuator endpoints.
 */
@Component
public class ActuatorDataCollectionService {

    private static final Logger logger = LoggerFactory.getLogger(ActuatorDataCollectionService.class);

    private final Storage storage;
    private final Map<String, ActuatorEndpointCollector> collectors;
    private final ActuatorEndpointDiscoveryService discoveryService;

    @Autowired
    public ActuatorDataCollectionService(
            Storage storage,
            List<ActuatorEndpointCollector> collectorList,
            ActuatorEndpointDiscoveryService discoveryService) {
        this.storage = storage;
        this.discoveryService = discoveryService;

        // Map collectors by endpoint type for easy lookup
        this.collectors = collectorList.stream()
                .collect(Collectors.toMap(ActuatorEndpointCollector::getEndpointType, Function.identity()));

        logger.info("Initialized with {} collectors: {}", collectors.size(), 
                collectors.keySet().stream().collect(Collectors.joining(", ")));
    }

    /**
     * Scheduled data collection for all services.
     * This method is called periodically to collect data from all registered services.
     */
    @Scheduled(fixedDelayString = "${obserra.collection.interval-ms:30000}")
    public void collectAllData() {
        logger.debug("Running scheduled data collection for all services");

        List<Service> services = storage.getAllServices();
        logger.debug("Found {} services for data collection", services.size());

        for (Service service : services) {
            collectServiceData(service);
        }
    }

    /**
     * Collect data for a specific service.
     *
     * @param service The service to collect data for
     * @return true if data was collected successfully, false otherwise
     */
    public boolean collectServiceData(Service service) {
        logger.debug("Collecting data for service: {} ({})", service.getName(), service.getId());
        boolean anySuccess = false;

        // Get the list of actuator endpoints for this service
        List<ActuatorEndpoint> endpoints = service.getActuatorEndpoints();
        if (endpoints == null || endpoints.isEmpty()) {
            logger.warn("No actuator endpoints available for service {}", service.getName());

            // Try to discover endpoints if none are available
            try {
                endpoints = discoveryService.discoverEndpoints(service);
                if (!endpoints.isEmpty()) {
                    service.setActuatorEndpoints(endpoints);
                    service = storage.updateService(service.getId(), service);
                    logger.info("Discovered {} actuator endpoints for service {}", endpoints.size(), service.getName());
                }
            } catch (Exception e) {
                logger.error("Error discovering actuator endpoints for service {}: {}", service.getName(), e.getMessage());
            }

            if (endpoints == null || endpoints.isEmpty()) {
                return false;
            }
        }

        // Process each endpoint with the appropriate collector
        for (ActuatorEndpoint endpoint : endpoints) {
            ActuatorEndpointCollector collector = collectors.get(endpoint.getId());
            if (collector != null) {
                try {
                    boolean success = collector.collectData(service, endpoint);
                    if (success) {
                        anySuccess = true;
                    }
                } catch (Exception e) {
                    logger.error("Error collecting data from endpoint {} for service {}: {}", 
                            endpoint.getId(), service.getName(), e.getMessage());
                }
            } else {
                logger.debug("No collector available for endpoint type: {}", endpoint.getId());
            }
        }

        return anySuccess;
    }
}
