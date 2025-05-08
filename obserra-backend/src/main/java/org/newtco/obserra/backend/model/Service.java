package org.newtco.obserra.backend.model;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Model representing a Spring Boot application service.
 * This corresponds to the 'services' table in the schema.
 */
public class Service {

    private Long id;
    private String name;
    private String namespace = "default";
    private String version = "unknown";
    private String podName;
    private ServiceStatus status = ServiceStatus.UNKNOWN;
    private LocalDateTime lastUpdated = LocalDateTime.now();
    private LocalDateTime lastSeen;
    private String clusterDns;
    private String actuatorUrl;
    private RegistrationSource registrationSource = RegistrationSource.KUBERNETES;
    private String appId;
    private Boolean autoRegister = false;
    private Duration checkInterval;
    private List<ActuatorEndpoint> actuatorEndpoints = new ArrayList<>();

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public Service setId(Long id) {
        this.id = id;
        return this;
    }

    public String getName() {
        return name;
    }

    public Service setName(String name) {
        this.name = name;
        return this;
    }

    public String getNamespace() {
        return namespace;
    }

    public Service setNamespace(String namespace) {
        this.namespace = namespace;
        return this;
    }

    public String getVersion() {
        return version;
    }

    public Service setVersion(String version) {
        this.version = version;
        return this;
    }

    public String getPodName() {
        return podName;
    }

    public Service setPodName(String podName) {
        this.podName = podName;
        return this;
    }

    public ServiceStatus getStatus() {
        return status;
    }

    public Service setStatus(ServiceStatus status) {
        this.status = status;
        return this;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public Service setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
        return this;
    }

    public LocalDateTime getLastSeen() {
        return lastSeen;
    }

    public Service setLastSeen(LocalDateTime lastSeen) {
        this.lastSeen = lastSeen;
        return this;
    }

    public String getClusterDns() {
        return clusterDns;
    }

    public Service setClusterDns(String clusterDns) {
        this.clusterDns = clusterDns;
        return this;
    }

    public String getActuatorUrl() {
        return actuatorUrl;
    }

    public Service setActuatorUrl(String actuatorUrl) {
        this.actuatorUrl = actuatorUrl;
        return this;
    }

    public RegistrationSource getRegistrationSource() {
        return registrationSource;
    }

    public Service setRegistrationSource(RegistrationSource registrationSource) {
        this.registrationSource = registrationSource;
        return this;
    }


    public String getAppId() {
        return appId;
    }

    public Service setAppId(String appId) {
        this.appId = appId;
        return this;
    }

    public Boolean getAutoRegister() {
        return autoRegister;
    }

    public Service setAutoRegister(Boolean autoRegister) {
        this.autoRegister = autoRegister;
        return this;
    }

    public Duration getCheckInterval() {
        return checkInterval;
    }

    public Service setCheckInterval(Duration checkInterval) {
        this.checkInterval = checkInterval;
        return this;
    }

    public List<ActuatorEndpoint> getActuatorEndpoints() {
        return actuatorEndpoints;
    }

    public Service setActuatorEndpoints(List<ActuatorEndpoint> actuatorEndpoints) {
        this.actuatorEndpoints = actuatorEndpoints;
        return this;
    }

    /**
     * Add an actuator endpoint to the list of available endpoints
     *
     * @param endpoint The actuator endpoint to add
     */
    public void addActuatorEndpoint(ActuatorEndpoint endpoint) {
        if (this.actuatorEndpoints == null) {
            this.actuatorEndpoints = new ArrayList<>();
        }
        this.actuatorEndpoints.add(endpoint);
    }

    /**
     * Find an actuator endpoint by its ID
     *
     * @param id The endpoint ID to find
     * @return The actuator endpoint, or null if not found
     */
    public ActuatorEndpoint findActuatorEndpoint(String id) {
        if (this.actuatorEndpoints == null) {
            return null;
        }
        return this.actuatorEndpoints.stream()
                .filter(endpoint -> id.equals(endpoint.getType()))
                .findFirst()
                .orElse(null);
    }
}
