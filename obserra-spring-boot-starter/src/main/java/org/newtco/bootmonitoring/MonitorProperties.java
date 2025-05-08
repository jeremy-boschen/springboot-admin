package org.newtco.bootmonitoring;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Configuration properties for the Spring Boot Monitor Client
 * <p>
 * These properties can be set in application.properties or application.yml and will be automatically bound to this
 * class.
 * <p>
 * Properties should be defined when possible, otherwise attempts will be made to provide meaningful defaults.
 */
@Component
@ConfigurationProperties(prefix = "obserra")
public class MonitorProperties {

    /**
     * Whether monitoring is enabled
     */
    private boolean enabled = false;

    /**
     * URL of the monitoring backend
     */
    private String registrationServer = "localhost:3000";

    /**
     * Application ID to use for registration. If not specified, a random UUID will be generated
     */
    private String appId;

    /**
     * Application name to use for registration. If not specified, the application name will be derived from the various
     * application properties (e.g., spring.application.name)
     */
    private String appName;

    /**
     * Application version to use for registration. If not specified, the application version will be derived from the
     * various application properties (e.g., spring.application.version)
     */
    private String appVersion;

    /**
     * Application description to use for registration. If not specified, the application description will be derived
     * from the various application properties (e.g., spring.application.description)
     */
    private String appDescription;

    /**
     * Whether to auto-register with the dashboard on startup
     */
    private boolean autoRegister = true;

    /**
     * Interval in milliseconds for the backend to service
     */
    private Duration checkInterval = Duration.ofSeconds(30);

    public boolean isEnabled() {
        return enabled;
    }

    public MonitorProperties setEnabled(boolean enabled) {
        this.enabled = enabled;
        return this;
    }

    public String getRegistrationServer() {
        return registrationServer;
    }

    public MonitorProperties setRegistrationServer(String registrationServer) {
        this.registrationServer = registrationServer;
        return this;
    }

    public String getAppId() {
        return appId;
    }

    public MonitorProperties setAppId(String appId) {
        this.appId = appId;
        return this;
    }

    public String getAppName() {
        return appName;
    }

    public MonitorProperties setAppName(String appName) {
        this.appName = appName;
        return this;
    }

    public String getAppVersion() {
        return appVersion;
    }

    public MonitorProperties setAppVersion(String appVersion) {
        this.appVersion = appVersion;
        return this;
    }

    public String getAppDescription() {
        return appDescription;
    }

    public MonitorProperties setAppDescription(String appDescription) {
        this.appDescription = appDescription;
        return this;
    }

    public boolean isAutoRegister() {
        return autoRegister;
    }

    public MonitorProperties setAutoRegister(boolean autoRegister) {
        this.autoRegister = autoRegister;
        return this;
    }

    public Duration getCheckInterval() {
        return checkInterval;
    }

    public MonitorProperties setCheckInterval(Duration checkInterval) {
        this.checkInterval = checkInterval;
        return this;
    }
}