package org.newtco.obserra.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.newtco.obserra.backend.collector.actuator.DiscoveryService;
import org.newtco.obserra.backend.model.Service;
import org.newtco.obserra.backend.model.ServiceStatus;
import org.newtco.obserra.backend.storage.Storage;
import org.newtco.obserra.shared.model.ErrorResponse;
import org.newtco.obserra.shared.model.ServiceRegistration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

/**
 * Controller for service registration. This controller provides endpoints for services to register themselves with the
 * server.
 */
@RestController
public class ServiceRegistrationController {

    private static final Logger logger = LoggerFactory.getLogger(ServiceRegistrationController.class);

    private final Storage          storage;
    private final DiscoveryService discoveryService;

    @Autowired
    public ServiceRegistrationController(Storage storage, DiscoveryService discoveryService) {
        this.storage = storage;
        this.discoveryService = discoveryService;
    }

    private String buildRegistrationActuatorUrl(ServiceRegistration.Request registration, HttpServletRequest serverRequest) {
        // If the client passed a full URL, use it
        var actuatorUrl = registration.getActuatorUrl();
        if (actuatorUrl.endsWith("/")) {
            actuatorUrl = actuatorUrl.substring(0, actuatorUrl.length() - 1);
        }

        if (actuatorUrl.startsWith("http:") || actuatorUrl.startsWith("https:")) {
            return actuatorUrl;
        }

        // Determine the calling client's hostname/port for constructing the callback URL
        var clientHost = serverRequest.getHeader("X-Forwarded-For");
        if (clientHost != null && !clientHost.isBlank()) {
            logger.debug("appId:{} - Using X-Forwarded-For header for client host {}", registration.getAppId(), clientHost);
        } else {
            clientHost = serverRequest.getRemoteHost();
            if (clientHost != null && !clientHost.isBlank()) {
                logger.debug("appId:{} - Using remote host for client host {}", registration.getAppId(), clientHost);
            } else {
                clientHost = serverRequest.getRemoteAddr();
                logger.debug("appId:{} - Using remote address for client host {}", registration.getAppId(), clientHost);
            }
        }

        var clientPort = "";
        if (registration.getActuatorPort() > 0) {
            clientPort = String.valueOf(registration.getActuatorPort());
        } else {
            clientPort = serverRequest.getHeader("X-Forwarded-Port");
            if (clientPort != null && !clientPort.isBlank()) {
                logger.debug("appId:{} - Using X-Forwarded-Port header for client port {}", registration.getAppId(), clientPort);
            } else {
                clientPort = String.valueOf(serverRequest.getRemotePort());
                logger.debug("appId:{} - Using remote port for client port {}", registration.getAppId(), clientPort);
            }
        }

        var scheme = clientPort.endsWith("443") ? "https" : "http";

        return scheme + "://" + clientHost + ":" + clientPort + (actuatorUrl.startsWith("/") ? "" : "/") + actuatorUrl;
    }

    /**
     * Register a service. This endpoint allows services to register themselves with the server.
     *
     * @param registration the service registration registration
     * @return the registered service
     */
    @RequestMapping(
            path = "/api/service/register",
            method = RequestMethod.POST,
            consumes = "application/json",
            produces = "application/json"
    )
    public ResponseEntity<?> registerService(HttpServletRequest serverRequest, @RequestBody ServiceRegistration.Request registration) {
        try {
            if (logger.isDebugEnabled()) {
                logger.debug("appId: {} - Received service registration request: {}", registration.getAppId(), registration);
            } else {
                logger.info("appId: {} - Received service registration request", registration.getAppId());
            }

            // Validate required fields
            if (registration.getName() == null || registration.getActuatorUrl() == null) {
                return ResponseEntity.badRequest()
                        .body("Missing required fields: name, actuatorUrl");
            }

            var actuatorUrl = buildRegistrationActuatorUrl(registration, serverRequest);
            logger.info("appId:{} - Using callback actuator URL '{}'", registration.getAppId(), actuatorUrl);

            var service = new Service()
                    .setName(registration.getName())
                    .setAppId(registration.getAppId())
                    .setVersion(registration.getVersion())
                    .setActuatorUrl(actuatorUrl)
                    .setAutoRegister(registration.isAutoRegister())
                    .setCheckInterval(registration.getCheckInterval());


            // Discover available actuator endpoints
            try {
                var endpoints = discoveryService.discoverServiceEndpoints(service);
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

            // Unregister the existing service if it exists
            storage.getServiceByAppId(registration.getAppId()).ifPresent(existing -> {
                storage.deleteService(existing.getId());
            });


            service = storage.createService(service);
            logger.info("Registered new service: {} ({})", service.getName(), service.getAppId());


            // Return the registered service
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ServiceRegistration.Response(
                            Long.toHexString(service.getId())
                    ));
        } catch (Exception e) {
            logger.error("Error registering service", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to register service"));
        }
    }

    /**
     * Get all registered services.
     *
     * @return a list of all registered services
     */
    @GetMapping("/api/services")
    public ResponseEntity<?> getAllServices() {
        try {
            return ResponseEntity.ok(storage.getAllServices());
        } catch (Exception e) {
            logger.error("Error fetching services", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to fetch services"));
        }
    }

    /**
     * Get a specific service by ID.
     *
     * @param id the service ID
     * @return the service with the specified ID
     */
    @GetMapping("/api/services/{id}")
    public ResponseEntity<?> getService(@PathVariable Long id) {
        try {
            Optional<Service> service = storage.getService(id);
            if (service.isPresent()) {
                return ResponseEntity.ok(service.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ErrorResponse("Service not found"));
            }
        } catch (Exception e) {
            logger.error("Error fetching service", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to fetch service"));
        }
    }

    /**
     * Deregister a service by appId. This endpoint allows services to deregister themselves when they shut down.
     *
     * @param registrationId Registration ID provided by the response to registration
     * @return success or error response
     */
    @DeleteMapping("/api/service/unregister/{registrationId}")
    public ResponseEntity<?> deregisterService(@PathVariable String registrationId) {
        try {
            logger.info("Received deregistration request for appId: {}", registrationId);

            Optional<Service> serviceOpt = storage.getServiceByAppId(registrationId);
            if (serviceOpt.isPresent()) {
                Service service = serviceOpt.get();
                service.setStatus(ServiceStatus.DOWN);
                storage.updateService(service.getId(), service);
                logger.info("Service deregistered: {} ({})", service.getName(), registrationId);
                return ResponseEntity.ok().build();
            } else {
                logger.warn("Service not found for deregistration: {}", registrationId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ErrorResponse("Service not found"));
            }
        } catch (Exception e) {
            logger.error("Error deregistering service", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Failed to deregister service"));
        }
    }
}
