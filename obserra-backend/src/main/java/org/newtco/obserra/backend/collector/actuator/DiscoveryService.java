package org.newtco.obserra.backend.collector.actuator;

import org.newtco.obserra.backend.model.ActuatorEndpoint;
import org.newtco.obserra.backend.model.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.endpoint.web.Link;
import org.springframework.boot.http.client.ClientHttpRequestFactoryBuilder;
import org.springframework.boot.http.client.ClientHttpRequestFactorySettings;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Service for discovering available actuator endpoints from a Spring Boot application.
 * This service queries the actuator endpoint to discover available endpoints, accepting each
 * for which there is an available ActuatorCollector.
 */
@Component("actuatorDiscoveryService")
public class DiscoveryService {

    private static final Logger logger = LoggerFactory.getLogger(DiscoveryService.class);

    private final RestClient              resetClient;
    private final List<ActuatorCollector> collectors;

    @Autowired
    public DiscoveryService(
            RestClient.Builder restClientBuilder,
            @Value("${obserra.discovery.spring-boot.timeout:${obserra.discovery.timeout:5s}}")
            Duration discoveryTimeout,
            List<ActuatorCollector> collectors) {

        this.resetClient = restClientBuilder
                .requestFactory(ClientHttpRequestFactoryBuilder.detect().build(
                        ClientHttpRequestFactorySettings.defaults()
                                                        .withConnectTimeout(discoveryTimeout)
                                                        .withReadTimeout(discoveryTimeout)))
                .defaultHeader("Content-Type", "application/json")
                .defaultHeader("Accept", "application/json")
                .build();
        this.collectors  = collectors;
    }

    /**
     * Discover available actuator endpoints for a service
     *
     * @param service The service to discover endpoints for
     * @return A list of discovered actuator endpoints
     */
    public List<ActuatorEndpoint> discoverServiceEndpoints(Service service) {
        logger.info("Discovering Spring Boot actuator endpoints for service: {} ({})", service.getName(), service.getId());

        try {
            var actuatorLinks = resetClient.get()
                                           .uri(service.getActuatorUrl())
                                           .retrieve()
                                           .body(ActuatorLinks.class);

            if (null != actuatorLinks) {
                return actuatorLinks._links().entrySet().stream()
                                    .map(entry -> new ActuatorEndpoint()
                                            .setType(entry.getKey())
                                            .setHref(entry.getValue().getHref())
                                            .setEnabled(entry.getValue().isTemplated()))
                                    .filter(endpoint -> collectors.stream().anyMatch(collector -> collector.canCollect(endpoint)))
                                    .toList();
            }
        } catch (HttpStatusCodeException e) {
            logger.error("Error discovering Spring Boot actuator endpoints for service {}: {}", service.getName(), e.getMessage(), e);
        }

        return List.of();
    }

    /**
     * POJO for the actuator links response
     */
    private record ActuatorLinks(Map<String, Link> _links) {}
}