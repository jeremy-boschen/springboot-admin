package org.newtco.obserra.shared.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.HashMap;
import java.util.Map;

/**
 * Response payload for health data from a Spring Boot actuator health endpoint.
 * This class represents the data returned from the health endpoint.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class HealthResponse {

    @JsonProperty("status")
    private String status;

    @JsonProperty("components")
    private Map<String, HealthComponent> components = new HashMap<>();

    // Default constructor for Jackson
    public HealthResponse() {
    }

    // Constructor with status
    public HealthResponse(String status) {
        this.status = status;
    }

    // Getters and Setters

    public String getStatus() {
        return status;
    }

    public HealthResponse setStatus(String status) {
        this.status = status;
        return this;
    }

    public Map<String, HealthComponent> getComponents() {
        return components;
    }

    public HealthResponse setComponents(Map<String, HealthComponent> components) {
        this.components = components;
        return this;
    }

    public HealthResponse addComponent(String name, HealthComponent component) {
        if (this.components == null) {
            this.components = new HashMap<>();
        }
        this.components.put(name, component);
        return this;
    }

    /**
     * Inner class representing a health component
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class HealthComponent {
        @JsonProperty("status")
        private String status;

        @JsonProperty("details")
        private Map<String, Object> details = new HashMap<>();

        // Default constructor for Jackson
        public HealthComponent() {
        }

        // Constructor with status
        public HealthComponent(String status) {
            this.status = status;
        }

        // Getters and Setters

        public String getStatus() {
            return status;
        }

        public HealthComponent setStatus(String status) {
            this.status = status;
            return this;
        }

        public Map<String, Object> getDetails() {
            return details;
        }

        public HealthComponent setDetails(Map<String, Object> details) {
            this.details = details;
            return this;
        }

        public HealthComponent addDetail(String name, Object value) {
            if (this.details == null) {
                this.details = new HashMap<>();
            }
            this.details.put(name, value);
            return this;
        }
    }
}
