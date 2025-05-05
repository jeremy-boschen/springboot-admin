package org.newtco.obserra.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.newtco.obserra.backend.model.ActuatorEndpoint;
import org.newtco.obserra.backend.model.Service;
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
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/**
 * Service for discovering available actuator endpoints from a Spring Boot application.
 * This service queries the actuator endpoint to discover available endpoints.
 */
@Component
public class ActuatorEndpointDiscoveryService {

    private static final Logger logger = LoggerFactory.getLogger(ActuatorEndpointDiscoveryService.class);

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Autowired
    public ActuatorEndpointDiscoveryService(
            RestTemplateBuilder restTemplateBuilder,
            ObjectMapper objectMapper,
            @Value("${obserra.discovery.timeout-ms:5000}") int discoveryTimeoutMs) {
        this.objectMapper = objectMapper;

        // Configure RestTemplate with timeout
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofMillis(discoveryTimeoutMs))
                .setReadTimeout(Duration.ofMillis(discoveryTimeoutMs))
                .build();
    }

    /**
     * Discover available actuator endpoints for a service
     *
     * @param service The service to discover endpoints for
     * @return A list of discovered actuator endpoints
     */
    public List<ActuatorEndpoint> discoverEndpoints(Service service) {
        logger.info("Discovering actuator endpoints for service: {} ({})", service.getName(), service.getId());
        List<ActuatorEndpoint> endpoints = new ArrayList<>();

        try {
            // Query the base actuator URL to get available endpoints
            String actuatorUrl = service.getActuatorUrl();
            if (actuatorUrl.endsWith("/")) {
                actuatorUrl = actuatorUrl.substring(0, actuatorUrl.length() - 1);
            }

            ResponseEntity<String> response = restTemplate.getForEntity(actuatorUrl, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode rootNode = objectMapper.readTree(response.getBody());
                JsonNode linksNode = rootNode.path("_links");

                if (linksNode.isObject()) {
                    Iterator<Map.Entry<String, JsonNode>> fields = linksNode.fields();
                    while (fields.hasNext()) {
                        Map.Entry<String, JsonNode> field = fields.next();
                        String endpointId = field.getKey();
                        
                        // Skip the self link
                        if ("self".equals(endpointId)) {
                            continue;
                        }
                        
                        JsonNode hrefNode = field.getValue().path("href");
                        if (hrefNode.isTextual()) {
                            String href = hrefNode.asText();
                            
                            // Create an endpoint object
                            ActuatorEndpoint endpoint = new ActuatorEndpoint();
                            endpoint.setId(endpointId);
                            endpoint.setUrl(href);
                            endpoint.setEnabled(true);
                            endpoint.setSensitive(false);
                            
                            endpoints.add(endpoint);
                            logger.debug("Discovered endpoint: {} -> {}", endpointId, href);
                        }
                    }
                }
            }
        } catch (RestClientException e) {
            logger.error("Error discovering actuator endpoints for service {}: {}", service.getName(), e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error discovering actuator endpoints", e);
        }

        logger.info("Discovered {} actuator endpoints for service {}", endpoints.size(), service.getName());
        return endpoints;
    }
}