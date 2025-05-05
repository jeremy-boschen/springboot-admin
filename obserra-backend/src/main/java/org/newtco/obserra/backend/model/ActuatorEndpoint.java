package org.newtco.obserra.backend.model;

/**
 * Model representing a Spring Boot actuator endpoint.
 * This class stores information about an available actuator endpoint.
 */
public class ActuatorEndpoint {

    private String id;
    private String url;
    private boolean enabled;
    private boolean sensitive;

    /**
     * Default constructor
     */
    public ActuatorEndpoint() {
    }

    /**
     * Constructor with all fields
     *
     * @param id The endpoint identifier (e.g., "health", "metrics")
     * @param url The full URL to the endpoint
     * @param enabled Whether the endpoint is enabled
     * @param sensitive Whether the endpoint is sensitive
     */
    public ActuatorEndpoint(String id, String url, boolean enabled, boolean sensitive) {
        this.id = id;
        this.url = url;
        this.enabled = enabled;
        this.sensitive = sensitive;
    }

    // Getters and Setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public boolean isSensitive() {
        return sensitive;
    }

    public void setSensitive(boolean sensitive) {
        this.sensitive = sensitive;
    }

    @Override
    public String toString() {
        return "ActuatorEndpoint{" +
                "id='" + id + '\'' +
                ", url='" + url + '\'' +
                ", enabled=" + enabled +
                ", sensitive=" + sensitive +
                '}';
    }
}