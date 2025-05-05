package org.newtco.obserra.backend.model;

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
    private String healthCheckPath;
    private RegistrationSource registrationSource = RegistrationSource.KUBERNETES;
    private String hostAddress;
    private Integer port;
    private String contextPath;
    private String appId;
    private String metricsPath;
    private String logsPath;
    private String configPath;
    private Boolean autoRegister = false;
    private Integer healthCheckInterval;
    private List<ActuatorEndpoint> actuatorEndpoints = new ArrayList<>();

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getNamespace() {
        return namespace;
    }

    public void setNamespace(String namespace) {
        this.namespace = namespace;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getPodName() {
        return podName;
    }

    public void setPodName(String podName) {
        this.podName = podName;
    }

    public ServiceStatus getStatus() {
        return status;
    }

    public void setStatus(ServiceStatus status) {
        this.status = status;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    public LocalDateTime getLastSeen() {
        return lastSeen;
    }

    public void setLastSeen(LocalDateTime lastSeen) {
        this.lastSeen = lastSeen;
    }

    public String getClusterDns() {
        return clusterDns;
    }

    public void setClusterDns(String clusterDns) {
        this.clusterDns = clusterDns;
    }

    public String getActuatorUrl() {
        return actuatorUrl;
    }

    public void setActuatorUrl(String actuatorUrl) {
        this.actuatorUrl = actuatorUrl;
    }

    public String getHealthCheckPath() {
        return healthCheckPath;
    }

    public void setHealthCheckPath(String healthCheckPath) {
        this.healthCheckPath = healthCheckPath;
    }

    public RegistrationSource getRegistrationSource() {
        return registrationSource;
    }

    public void setRegistrationSource(RegistrationSource registrationSource) {
        this.registrationSource = registrationSource;
    }

    public String getHostAddress() {
        return hostAddress;
    }

    public void setHostAddress(String hostAddress) {
        this.hostAddress = hostAddress;
    }

    public Integer getPort() {
        return port;
    }

    public void setPort(Integer port) {
        this.port = port;
    }

    public String getContextPath() {
        return contextPath;
    }

    public void setContextPath(String contextPath) {
        this.contextPath = contextPath;
    }

    public String getAppId() {
        return appId;
    }

    public void setAppId(String appId) {
        this.appId = appId;
    }

    public String getMetricsPath() {
        return metricsPath;
    }

    public void setMetricsPath(String metricsPath) {
        this.metricsPath = metricsPath;
    }

    public String getLogsPath() {
        return logsPath;
    }

    public void setLogsPath(String logsPath) {
        this.logsPath = logsPath;
    }

    public String getConfigPath() {
        return configPath;
    }

    public void setConfigPath(String configPath) {
        this.configPath = configPath;
    }

    public Boolean getAutoRegister() {
        return autoRegister;
    }

    public void setAutoRegister(Boolean autoRegister) {
        this.autoRegister = autoRegister;
    }

    public Integer getHealthCheckInterval() {
        return healthCheckInterval;
    }

    public void setHealthCheckInterval(Integer healthCheckInterval) {
        this.healthCheckInterval = healthCheckInterval;
    }

    public List<ActuatorEndpoint> getActuatorEndpoints() {
        return actuatorEndpoints;
    }

    public void setActuatorEndpoints(List<ActuatorEndpoint> actuatorEndpoints) {
        this.actuatorEndpoints = actuatorEndpoints;
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
                .filter(endpoint -> id.equals(endpoint.getId()))
                .findFirst()
                .orElse(null);
    }
}
