package org.newtco.obserra.backend.model;

/**
 * Model representing a Spring Boot actuator endpoint.
 * This class stores information about an available actuator endpoint.
 */
public class ActuatorEndpoint {

    private String  type;
    private String  href;
    private boolean enabled;
    private boolean sensitive;
    private boolean templated;

    /**
     * Default constructor
     */
    public ActuatorEndpoint() {
    }

    /**
     * Constructor with all fields
     *
     * @param type      The endpoint identifier (e.g., "health", "metrics")
     * @param href      The full URL to the endpoint
     * @param enabled   Whether the endpoint is enabled
     * @param sensitive Whether the endpoint is sensitive
     * @param templated Whether the endpoint URL is templated
     */
    public ActuatorEndpoint(String type, String href, boolean enabled, boolean sensitive, boolean templated) {
        this.type      = type;
        this.href      = href;
        this.enabled   = enabled;
        this.sensitive = sensitive;
        this.templated = templated;
    }

    // Getters and Setters

    public String getType() {
        return type;
    }

    public ActuatorEndpoint setType(String type) {
        this.type = type;
        return this;
    }

    public String getHref() {
        return href;
    }

    public ActuatorEndpoint setHref(String href) {
        this.href = href;
        return this;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public ActuatorEndpoint setEnabled(boolean enabled) {
        this.enabled = enabled;
        return this;
    }

    public boolean isSensitive() {
        return sensitive;
    }

    public ActuatorEndpoint setSensitive(boolean sensitive) {
        this.sensitive = sensitive;
        return this;
    }

    public boolean isTemplated() {
        return templated;
    }

    public ActuatorEndpoint setTemplated(boolean templated) {
        this.templated = templated;
        return this;
    }

    @Override
    public String toString() {
        return "ActuatorEndpoint{" +
                "type='" + type + '\'' +
                ", url='" + href + '\'' +
                ", enabled=" + enabled +
                ", sensitive=" + sensitive +
                ", templated=" + templated +
                '}';
    }
}