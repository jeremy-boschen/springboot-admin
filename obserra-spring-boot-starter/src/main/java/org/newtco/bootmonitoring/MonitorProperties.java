package org.newtco.bootmonitoring;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for the Spring Boot Monitor Client
 * 
 * These properties can be set in application.properties or application.yml
 * and will be automatically bound to this class.
 */
@Component
@ConfigurationProperties(prefix = "monitor")
public class MonitorProperties {
    
    /**
     * Whether monitoring is enabled
     */
    private boolean enabled = false;
    
    /**
     * URL of the monitoring dashboard
     */
    private String dashboardUrl = "http://localhost:3000";
    
    /**
     * Application ID to use for registration
     * If not specified, a random UUID will be generated
     */
    private String appId;
    
    /**
     * Whether to auto-register with the dashboard on startup
     */
    private boolean autoRegister = true;
    
    /**
     * Interval in milliseconds between heartbeat checks
     */
    private long heartbeatIntervalMs = 30000;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getDashboardUrl() {
        return dashboardUrl;
    }

    public void setDashboardUrl(String dashboardUrl) {
        this.dashboardUrl = dashboardUrl;
    }

    public String getAppId() {
        return appId;
    }

    public void setAppId(String appId) {
        this.appId = appId;
    }

    public boolean isAutoRegister() {
        return autoRegister;
    }

    public void setAutoRegister(boolean autoRegister) {
        this.autoRegister = autoRegister;
    }

    public long getHeartbeatIntervalMs() {
        return heartbeatIntervalMs;
    }

    public void setHeartbeatIntervalMs(long heartbeatIntervalMs) {
        this.heartbeatIntervalMs = heartbeatIntervalMs;
    }
}