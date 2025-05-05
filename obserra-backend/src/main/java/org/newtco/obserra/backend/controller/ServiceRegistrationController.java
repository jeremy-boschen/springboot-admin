package org.newtco.obserra.backend.controller;

import org.newtco.obserra.backend.model.ActuatorEndpoint;
import org.newtco.obserra.backend.model.RegistrationSource;
import org.newtco.obserra.backend.model.Service;
import org.newtco.obserra.backend.model.ServiceStatus;
import org.newtco.obserra.backend.service.ActuatorEndpointDiscoveryService;
import org.newtco.obserra.backend.storage.Storage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Controller for service registration.
 * This controller provides endpoints for services to register themselves with the server.
 */
@RestController
@RequestMapping("/api")
public class ServiceRegistrationController {

    private static final Logger logger = LoggerFactory.getLogger(ServiceRegistrationController.class);

    private final Storage storage;
    private final ActuatorEndpointDiscoveryService discoveryService;

    @Autowired
    public ServiceRegistrationController(Storage storage, ActuatorEndpointDiscoveryService discoveryService) {
        this.storage = storage;
        this.discoveryService = discoveryService;
    }

    /**
     * Register a service.
     * This endpoint allows services to register themselves with the server.
     *
     * @param registrationData the registration data
     * @return the registered service
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerService(@RequestBody Map<String, Object> registrationData) {
        try {
            logger.info("Received registration request: {}", registrationData);

            // Validate required fields
            if (!registrationData.containsKey("name") || !registrationData.containsKey("actuatorUrl")) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Invalid registration data",
                        "details", "Name and actuatorUrl are required"
                ));
            }

            // Extract data
            String name = (String) registrationData.get("name");
            String actuatorUrl = (String) registrationData.get("actuatorUrl");
            String appId = (String) registrationData.getOrDefault("appId", UUID.randomUUID().toString());
            String version = (String) registrationData.getOrDefault("version", "unknown");
            String healthCheckPath = (String) registrationData.getOrDefault("healthCheckPath", "/actuator/health");
            String metricsPath = (String) registrationData.getOrDefault("metricsPath", "/actuator/metrics");
            String logsPath = (String) registrationData.getOrDefault("logsPath", "/actuator/logfile");
            String configPath = (String) registrationData.getOrDefault("configPath", "/actuator/env");
            Integer healthCheckInterval = registrationData.containsKey("healthCheckInterval") ?
                    Integer.parseInt(registrationData.get("healthCheckInterval").toString()) : 30;
            Boolean autoRegister = (Boolean) registrationData.getOrDefault("autoRegister", false);

            // Extract connection details
            String hostAddress = (String) registrationData.getOrDefault("hostAddress", null);
            Integer port = registrationData.containsKey("port") ?
                    Integer.parseInt(registrationData.get("port").toString()) : null;
            String contextPath = (String) registrationData.getOrDefault("contextPath", "");

            // If hostAddress or port is not provided, try to extract from actuatorUrl
            if (hostAddress == null || port == null) {
                try {
                    java.net.URL url = new java.net.URL(actuatorUrl);
                    hostAddress = hostAddress != null ? hostAddress : url.getHost();
                    port = port != null ? port : (url.getPort() != -1 ? url.getPort() : 
                            (url.getProtocol().equals("https") ? 443 : 80));
                } catch (Exception e) {
                    logger.error("Failed to parse actuator URL", e);
                }
            }

            // Check if this service has already registered with an appId
            Optional<Service> existingService = Optional.empty();
            if (appId != null) {
                existingService = storage.getServiceByAppId(appId);
            }

            // Create or update service
            Service service;
            if (existingService.isPresent()) {
                service = existingService.get();
                service.setName(name);
                service.setVersion(version);
                service.setActuatorUrl(actuatorUrl);
                service.setHealthCheckPath(healthCheckPath);
                service.setMetricsPath(metricsPath);
                service.setLogsPath(logsPath);
                service.setConfigPath(configPath);
                service.setHostAddress(hostAddress);
                service.setPort(port);
                service.setContextPath(contextPath);
                service.setHealthCheckInterval(healthCheckInterval);
                service.setAutoRegister(autoRegister);

                service = storage.updateService(service.getId(), service);
                logger.info("Updated existing service: {} ({})", service.getName(), service.getAppId());
            } else {
                service = new Service();
                service.setName(name);
                service.setNamespace("default"); // Default namespace for directly registered services
                service.setVersion(version);
                service.setStatus(ServiceStatus.UNKNOWN);
                service.setActuatorUrl(actuatorUrl);
                service.setRegistrationSource(RegistrationSource.DIRECT);
                service.setHostAddress(hostAddress);
                service.setPort(port);
                service.setContextPath(contextPath);
                service.setAppId(appId);
                service.setHealthCheckPath(healthCheckPath);
                service.setMetricsPath(metricsPath);
                service.setLogsPath(logsPath);
                service.setConfigPath(configPath);
                service.setAutoRegister(autoRegister);
                service.setHealthCheckInterval(healthCheckInterval);

                service = storage.createService(service);
                logger.info("Registered new service: {} ({})", service.getName(), service.getAppId());
            }

            // Discover available actuator endpoints
            try {
                List<ActuatorEndpoint> endpoints = discoveryService.discoverEndpoints(service);
                if (!endpoints.isEmpty()) {
                    // Update the service with discovered endpoints
                    service.setActuatorEndpoints(endpoints);
                    service = storage.updateService(service.getId(), service);
                    logger.info("Discovered {} actuator endpoints for service {}", endpoints.size(), service.getName());
                } else {
                    logger.warn("No actuator endpoints discovered for service {}", service.getName());
                }
            } catch (Exception e) {
                logger.error("Error discovering actuator endpoints for service {}: {}", service.getName(), e.getMessage());
            }

            // Return the registered service
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "id", service.getId(),
                    "name", service.getName(),
                    "status", service.getStatus(),
                    "registrationSource", service.getRegistrationSource(),
                    "appId", service.getAppId()
            ));
        } catch (Exception e) {
            logger.error("Error registering service", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to register service"));
        }
    }

    /**
     * Get all registered services.
     *
     * @return a list of all registered services
     */
    @GetMapping("/services")
    public ResponseEntity<?> getAllServices() {
        try {
            return ResponseEntity.ok(storage.getAllServices());
        } catch (Exception e) {
            logger.error("Error fetching services", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch services"));
        }
    }

    /**
     * Get a specific service by ID.
     *
     * @param id the service ID
     * @return the service with the specified ID
     */
    @GetMapping("/services/{id}")
    public ResponseEntity<?> getService(@PathVariable Long id) {
        try {
            Optional<Service> service = storage.getService(id);
            if (service.isPresent()) {
                return ResponseEntity.ok(service.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Service not found"));
            }
        } catch (Exception e) {
            logger.error("Error fetching service", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch service"));
        }
    }
}
