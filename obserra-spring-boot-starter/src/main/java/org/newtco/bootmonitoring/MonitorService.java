package org.newtco.bootmonitoring;

import org.newtco.obserra.shared.model.ServiceRegistration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PreDestroy;

/**
 * Service for interacting with the monitoring backend
 * <p>
 * This service provides methods for registering the application with the monitoring backend and sending custom
 * metrics.
 */
public class MonitorService {
    private static final Logger logger = LoggerFactory.getLogger(MonitorService.class);

    private final String       registrationServer;
    private final RestTemplate restTemplate;
    private       String       registrationId;

    /**
     * Constructor
     *
     * @param properties Monitor configuration properties
     */
    public MonitorService(RestTemplateBuilder restTemplateBuilder, MonitorProperties properties) {
        this.restTemplate       = restTemplateBuilder.build();
        this.registrationServer = properties.getRegistrationServer() + (properties.getRegistrationServer().endsWith("/")
                                                                        ? "" : "/");
    }

    /**
     * Register an application with the backend manually using a ServiceRegistrationRequest
     * <p>
     * This method can be used if auto-registration is disabled or if you need to re-register the application.
     *
     * @param registration ServiceRegistrationRequest with application information
     */
    public void registerWithBackend(ServiceRegistration.Request registration) {
        try {
            var headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            var response = restTemplate.postForObject(
                    registrationServer + "api/service/register",
                    new HttpEntity<>(registration, headers),
                    ServiceRegistration.Response.class);

            if (response != null && response.getRegistrationId() != null) {
                registrationId = response.getRegistrationId();
            } else {
                logger.error("Failed to register with monitoring backend: no registrationId returned");
            }
        } catch (Exception e) {
            logger.error("Failed to register with monitoring backend", e);
        }
    }

    /**
     * Get the registered application ID
     *
     * @return The registered application ID
     */
    public String getRegistrationId() {
        return registrationId;
    }

    /**
     * Set the registered application ID This is usually called internally but can be used for testing
     *
     * @param registrationId The registered application ID
     */
    public void setRegistrationId(String registrationId) {
        this.registrationId = registrationId;
    }

    /**
     * Deregister application from the backend
     * <p>
     * This method should be called when the application is shutting down to notify the backend that the service is no
     * longer available.
     */
    @PreDestroy
    public void unregisterFromBackend() {
        if (registrationId != null) {
            try {
                // Deregister with Backend
                restTemplate.delete(registrationServer + "api/service/unregister/" + registrationId);
            } catch (Exception e) {
                logger.error("Failed to deregister from backend", e);
            }

            registrationId = null;
        }
    }
}
