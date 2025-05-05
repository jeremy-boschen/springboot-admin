package org.newtco.obserra.backend.controller;

import org.newtco.obserra.backend.model.ConfigProperty;
import org.newtco.obserra.backend.model.Logger;
import org.newtco.obserra.backend.model.LoggerLevel;
import org.newtco.obserra.backend.model.Service;
import org.newtco.obserra.backend.service.LoggerService;
import org.newtco.obserra.backend.storage.Storage;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Controller for configuration properties and loggers.
 * This controller provides endpoints for managing configuration properties and loggers for services.
 */
@RestController
@RequestMapping("/api")
public class ConfigAndLoggersController {

    private static final org.slf4j.Logger logger = LoggerFactory.getLogger(ConfigAndLoggersController.class);

    private final Storage storage;
    private final LoggerService loggerService;

    @Autowired
    public ConfigAndLoggersController(
            Storage storage,
            LoggerService loggerService) {
        this.storage = storage;
        this.loggerService = loggerService;
    }

    /**
     * Get all configuration properties for a service.
     *
     * @param id the service ID
     * @return the configuration properties for the specified service
     */
    @GetMapping("/services/{id}/config")
    public ResponseEntity<?> getServiceConfigProperties(@PathVariable Long id) {
        try {
            Optional<Service> service = storage.getService(id);
            if (!service.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Service not found"));
            }

            List<ConfigProperty> properties = storage.getConfigPropertiesForService(id);
            
            return ResponseEntity.ok(properties);
        } catch (Exception e) {
            logger.error("Error fetching configuration properties", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch configuration properties"));
        }
    }

    /**
     * Get a specific configuration property.
     *
     * @param id the service ID
     * @param propertyId the property ID
     * @return the configuration property
     */
    @GetMapping("/services/{id}/config/{propertyId}")
    public ResponseEntity<?> getServiceConfigProperty(
            @PathVariable Long id,
            @PathVariable Long propertyId) {
        try {
            Optional<Service> service = storage.getService(id);
            if (!service.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Service not found"));
            }

            Optional<ConfigProperty> property = storage.getConfigProperty(propertyId);
            if (!property.isPresent() || !property.get().getServiceId().equals(id)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Configuration property not found"));
            }
            
            return ResponseEntity.ok(property.get());
        } catch (Exception e) {
            logger.error("Error fetching configuration property", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch configuration property"));
        }
    }

    /**
     * Create a new configuration property.
     *
     * @param id the service ID
     * @param property the configuration property to create
     * @return the created configuration property
     */
    @PostMapping("/services/{id}/config")
    public ResponseEntity<?> createServiceConfigProperty(
            @PathVariable Long id,
            @RequestBody ConfigProperty property) {
        try {
            Optional<Service> service = storage.getService(id);
            if (!service.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Service not found"));
            }

            // Set the service ID and last updated timestamp
            property.setServiceId(id);
            property.setLastUpdated(LocalDateTime.now());
            
            ConfigProperty createdProperty = storage.createConfigProperty(property);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(createdProperty);
        } catch (Exception e) {
            logger.error("Error creating configuration property", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create configuration property"));
        }
    }

    /**
     * Update a configuration property.
     *
     * @param id the service ID
     * @param propertyId the property ID
     * @param property the updated configuration property
     * @return the updated configuration property
     */
    @PutMapping("/services/{id}/config/{propertyId}")
    public ResponseEntity<?> updateServiceConfigProperty(
            @PathVariable Long id,
            @PathVariable Long propertyId,
            @RequestBody ConfigProperty property) {
        try {
            Optional<Service> service = storage.getService(id);
            if (!service.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Service not found"));
            }

            Optional<ConfigProperty> existingProperty = storage.getConfigProperty(propertyId);
            if (!existingProperty.isPresent() || !existingProperty.get().getServiceId().equals(id)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Configuration property not found"));
            }
            
            // Set the ID, service ID, and last updated timestamp
            property.setId(propertyId);
            property.setServiceId(id);
            property.setLastUpdated(LocalDateTime.now());
            
            ConfigProperty updatedProperty = storage.updateConfigProperty(propertyId, property);
            
            return ResponseEntity.ok(updatedProperty);
        } catch (Exception e) {
            logger.error("Error updating configuration property", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update configuration property"));
        }
    }

    /**
     * Delete a configuration property.
     *
     * @param id the service ID
     * @param propertyId the property ID
     * @return a response with no content
     */
    @DeleteMapping("/services/{id}/config/{propertyId}")
    public ResponseEntity<?> deleteServiceConfigProperty(
            @PathVariable Long id,
            @PathVariable Long propertyId) {
        try {
            Optional<Service> service = storage.getService(id);
            if (!service.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Service not found"));
            }

            Optional<ConfigProperty> existingProperty = storage.getConfigProperty(propertyId);
            if (!existingProperty.isPresent() || !existingProperty.get().getServiceId().equals(id)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Configuration property not found"));
            }
            
            storage.deleteConfigProperty(propertyId);
            
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            logger.error("Error deleting configuration property", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete configuration property"));
        }
    }

    /**
     * Get available loggers and their levels for a service.
     *
     * @param id the service ID
     * @return the loggers for the specified service
     */
    @GetMapping("/services/{id}/loggers")
    public ResponseEntity<?> getServiceLoggers(@PathVariable Long id) {
        try {
            Optional<Service> serviceOpt = storage.getService(id);
            if (!serviceOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Service not found"));
            }

            Service service = serviceOpt.get();
            Map<String, Logger> loggers = loggerService.getLoggers(service);
            
            if (loggers == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Failed to fetch loggers"));
            }
            
            // Create a response with loggers and available levels
            Map<String, Object> response = Map.of(
                    "levels", loggerService.getAvailableLogLevels(),
                    "loggers", loggers
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching loggers", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch loggers"));
        }
    }

    /**
     * Set the level of a logger for a service.
     *
     * @param id the service ID
     * @param loggerName the name of the logger to set the level for
     * @param requestBody the request body containing the level to set
     * @return a response indicating success or failure
     */
    @PostMapping("/services/{id}/loggers/{loggerName}")
    public ResponseEntity<?> setServiceLoggerLevel(
            @PathVariable Long id,
            @PathVariable String loggerName,
            @RequestBody Map<String, String> requestBody) {
        try {
            Optional<Service> serviceOpt = storage.getService(id);
            if (!serviceOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Service not found"));
            }

            String level = requestBody.get("level");
            if (level == null || level.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Invalid log level"));
            }
            
            LoggerLevel loggerLevel;
            try {
                loggerLevel = LoggerLevel.valueOf(level);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Invalid log level"));
            }
            
            Service service = serviceOpt.get();
            boolean success = loggerService.setLoggerLevel(service, loggerName, loggerLevel);
            
            if (success) {
                return ResponseEntity.ok(Map.of("message", "Log level for " + loggerName + " set to " + level));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Failed to set log level"));
            }
        } catch (Exception e) {
            logger.error("Error setting log level", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to set log level"));
        }
    }
}