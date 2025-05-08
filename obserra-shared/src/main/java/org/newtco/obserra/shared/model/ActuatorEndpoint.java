package org.newtco.obserra.shared.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.List;

/**
 * Model representing a Spring Boot actuator endpoint.
 * This class stores information about an available actuator endpoint.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ActuatorEndpoint {

    @JsonProperty("id")
    private String id;

    @JsonProperty("url")
    private String url;

    @JsonProperty("enabled")
    private boolean enabled;

    @JsonProperty("sensitive")
    private boolean sensitive;

    /**
     * Default constructor for Jackson
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

    public ActuatorEndpoint setId(String id) {
        this.id = id;
        return this;
    }

    public String getUrl() {
        return url;
    }

    public ActuatorEndpoint setUrl(String url) {
        this.url = url;
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

    @Override
    public String toString() {
        return "ActuatorEndpoint{" +
                "id='" + id + '\'' +
                ", url='" + url + '\'' +
                ", enabled=" + enabled +
                ", sensitive=" + sensitive +
                '}';
    }

    /**
     * Response payload for actuator endpoint discovery.
     * This class represents the data returned from the actuator endpoint discovery service.
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Response {

        @JsonProperty("_links")
        private Links links;

        // Default constructor for Jackson
        public Response() {
            this.links = new Links();
        }

        // Getters and Setters

        public Links getLinks() {
            return links;
        }

        public Response setLinks(Links links) {
            this.links = links;
            return this;
        }

        /**
         * Inner class representing the _links object in the actuator response
         */
        @JsonInclude(JsonInclude.Include.NON_EMPTY)
        public static class Links {
            private final List<Link> links = new ArrayList<>();

            // Add a link to the links list
            public void addLink(String name, String href) {
                links.add(new Link(name, href));
            }

            // Get a link by name
            public Link getLink(String name) {
                return links.stream()
                        .filter(link -> name.equals(link.getName()))
                        .findFirst()
                        .orElse(null);
            }

            // Get all links
            public List<Link> getLinks() {
                return links;
            }
        }

        /**
         * Inner class representing a link in the _links object
         */
        @JsonInclude(JsonInclude.Include.NON_NULL)
        public static class Link {
            @JsonProperty("name")
            private String name;

            @JsonProperty("href")
            private String href;

            // Default constructor for Jackson
            public Link() {
            }

            // Constructor with all fields
            public Link(String name, String href) {
                this.name = name;
                this.href = href;
            }

            // Getters and Setters

            public String getName() {
                return name;
            }

            public Link setName(String name) {
                this.name = name;
                return this;
            }

            public String getHref() {
                return href;
            }

            public Link setHref(String href) {
                this.href = href;
                return this;
            }
        }
    }
}
