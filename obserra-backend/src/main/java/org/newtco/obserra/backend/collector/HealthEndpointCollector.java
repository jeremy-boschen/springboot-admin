package org.newtco.obserra.backend.collector;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.newtco.obserra.backend.model.ActuatorEndpoint;
import org.newtco.obserra.backend.model.Service;
import org.newtco.obserra.backend.model.ServiceStatus;
import org.newtco.obserra.backend.storage.Storage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Collector for health status from the Spring Boot actuator health endpoint.
 */
@Component
public class HealthEndpointCollector implements ActuatorEndpointCollector {

    private static final Logger logger = LoggerFactory.getLogger(HealthEndpointCollector.class);
    private static final String ENDPOINT_TYPE = "health";

    private final Storage storage;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Autowired
    public HealthEndpointCollector(
            Storage storage,
            RestTemplateBuilder restTemplateBuilder,
            ObjectMapper objectMapper,
            @Value("${obserra.health.timeout-ms:5000}") int healthTimeoutMs) {
        this.storage = storage;
        this.objectMapper = objectMapper;

        // Configure RestTemplate with timeout
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofMillis(healthTimeoutMs))
                .setReadTimeout(Duration.ofMillis(healthTimeoutMs))
                .build();
    }

    @Override
    public String getEndpointType() {
        return ENDPOINT_TYPE;
    }

    @Override
    public boolean canHandle(ActuatorEndpoint endpoint) {
        return endpoint != null && ENDPOINT_TYPE.equals(endpoint.getId());
    }

    @Override
    public boolean collectData(Service service, ActuatorEndpoint endpoint) {
        logger.debug("Checking health for service: {} ({})", service.getName(), service.getId());

        try {
            String healthUrl = endpoint.getUrl();
            ResponseEntity<String> response = restTemplate.getForEntity(healthUrl, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode healthData = objectMapper.readTree(response.getBody());
                String status = healthData.path("status").asText();

                // Update service status based on health check
                ServiceStatus serviceStatus = mapHealthStatus(status);
                updateServiceStatus(service, serviceStatus);

                logger.debug("Health check for service {} returned status: {}", service.getName(), status);
                return true;
            } else {
                logger.warn("Failed to check health for service {}: HTTP {}", 
                        service.getName(), response.getStatusCodeValue());
                // Update service status to DOWN if health check failed
                updateServiceStatus(service, ServiceStatus.DOWN);
                return false;
            }
        } catch (RestClientException e) {
            logger.warn("Failed to check health for service {}: {}", service.getName(), e.getMessage());
            // Update service status to DOWN if health check failed
            updateServiceStatus(service, ServiceStatus.DOWN);
            return false;
        } catch (Exception e) {
            logger.error("Error checking health for service {}: {}", service.getName(), e.getMessage());
            // Update service status to DOWN if health check failed
            updateServiceStatus(service, ServiceStatus.DOWN);
            return false;
        }
    }

    /**
     * Map Spring Boot health status to service status.
     *
     * @param healthStatus The health status from Spring Boot actuator
     * @return The corresponding service status
     */
    private ServiceStatus mapHealthStatus(String healthStatus) {
        if (healthStatus == null) {
            return ServiceStatus.UNKNOWN;
        }

        switch (healthStatus.toUpperCase()) {
            case "UP":
                return ServiceStatus.UP;
            case "DOWN":
                return ServiceStatus.DOWN;
            case "OUT_OF_SERVICE":
                return ServiceStatus.WARNING;
            case "UNKNOWN":
            default:
                return ServiceStatus.UNKNOWN;
        }
    }

    /**
     * Update the status of a service.
     *
     * @param service The service to update
     * @param status The new status
     */
    private void updateServiceStatus(Service service, ServiceStatus status) {
        if (service.getStatus() != status) {
            logger.info("Service {} status changed from {} to {}", 
                    service.getName(), service.getStatus(), status);
        }

        storage.updateServiceStatus(service.getId(), status);
        storage.updateServiceLastSeen(service.getId());
    }
}
