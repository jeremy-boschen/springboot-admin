package org.newtco.obserra.backend.service;

import org.newtco.obserra.backend.model.Logger;
import org.newtco.obserra.backend.model.LoggerLevel;
import org.newtco.obserra.backend.model.Service;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for interacting with the Spring Boot Actuator loggers endpoint.
 * This service provides methods for getting available loggers and setting logger levels.
 */
@Component
public class LoggerService {

    private static final org.slf4j.Logger logger = LoggerFactory.getLogger(LoggerService.class);

    private final RestTemplate restTemplate;
    private final int loggersTimeoutMs;

    @Autowired
    public LoggerService(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${obserra.loggers.timeout-ms:5000}") int loggersTimeoutMs) {
        this.loggersTimeoutMs = loggersTimeoutMs;

        // Configure RestTemplate with timeout
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofMillis(loggersTimeoutMs))
                .setReadTimeout(Duration.ofMillis(loggersTimeoutMs))
                .build();
    }

    /**
     * Get available loggers and their levels for a service.
     *
     * @param service the service to get loggers for
     * @return a map of logger names to Logger objects, or null if the request failed
     */
    public Map<String, Logger> getLoggers(Service service) {
        logger.debug("Getting loggers for service: {} ({})", service.getName(), service.getId());

        try {
            String loggersUrl = service.getActuatorUrl() + "/loggers";

            // Make the request to the actuator endpoint
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    loggersUrl,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                Map<String, Logger> loggers = new HashMap<>();

                // Extract the loggers from the response
                if (responseBody.containsKey("loggers")) {
                    Map<String, Map<String, String>> loggersMap = (Map<String, Map<String, String>>) responseBody.get("loggers");

                    for (Map.Entry<String, Map<String, String>> entry : loggersMap.entrySet()) {
                        String loggerName = entry.getKey();
                        Map<String, String> loggerInfo = entry.getValue();

                        Logger loggerObj = new Logger();
                        loggerObj.setName(loggerName);

                        // Set configured level if present
                        if (loggerInfo.containsKey("configuredLevel")) {
                            String configuredLevel = loggerInfo.get("configuredLevel");
                            if (configuredLevel != null) {
                                loggerObj.setConfiguredLevel(LoggerLevel.valueOf(configuredLevel));
                            }
                        }

                        // Set effective level if present
                        if (loggerInfo.containsKey("effectiveLevel")) {
                            String effectiveLevel = loggerInfo.get("effectiveLevel");
                            if (effectiveLevel != null) {
                                loggerObj.setEffectiveLevel(LoggerLevel.valueOf(effectiveLevel));
                            }
                        }

                        loggers.put(loggerName, loggerObj);
                    }
                }

                return loggers;
            } else {
                logger.warn("Failed to get loggers from service {}: HTTP {}", 
                        service.getName(), response.getStatusCodeValue());
                return null;
            }
        } catch (RestClientException e) {
            logger.warn("Failed to get loggers from service {}: {}", service.getName(), e.getMessage());
            return null;
        }
    }

    /**
     * Set the level of a logger for a service.
     *
     * @param service the service to set the logger level for
     * @param loggerName the name of the logger to set the level for
     * @param level the level to set
     * @return true if the level was set successfully, false otherwise
     */
    public boolean setLoggerLevel(Service service, String loggerName, LoggerLevel level) {
        logger.debug("Setting logger level for service: {} ({}), logger: {}, level: {}", 
                service.getName(), service.getId(), loggerName, level);

        try {
            String loggerUrl = service.getActuatorUrl() + "/loggers/" + loggerName;

            // Create the request body
            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("configuredLevel", level.toString());

            // Set up headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Create the request entity
            HttpEntity<Map<String, String>> requestEntity = new HttpEntity<>(requestBody, headers);

            // Make the request to the actuator endpoint
            ResponseEntity<Void> response = restTemplate.exchange(
                    loggerUrl,
                    HttpMethod.POST,
                    requestEntity,
                    Void.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                logger.debug("Successfully set logger level for service: {} ({}), logger: {}, level: {}", 
                        service.getName(), service.getId(), loggerName, level);
                return true;
            } else {
                logger.warn("Failed to set logger level for service {}, logger {}: HTTP {}", 
                        service.getName(), loggerName, response.getStatusCodeValue());
                return false;
            }
        } catch (RestClientException e) {
            logger.warn("Failed to set logger level for service {}, logger {}: {}", 
                    service.getName(), loggerName, e.getMessage());
            return false;
        }
    }

    /**
     * Get available log levels.
     *
     * @return a list of available log levels
     */
    public List<LoggerLevel> getAvailableLogLevels() {
        List<LoggerLevel> levels = new ArrayList<>();
        for (LoggerLevel level : LoggerLevel.values()) {
            levels.add(level);
        }
        return levels;
    }
}