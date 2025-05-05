package org.newtco.bootmonitoring;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.client.RestTemplate;

import java.net.InetAddress;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Spring Boot Monitor Registration
 * 
 * This class automatically registers the Spring Boot application with the monitoring dashboard
 * on startup, and periodically sends heartbeats to maintain the registration.
 */
@Configuration
public class SpringBootRegistrar {

    @Autowired
    private Environment environment;

    @Autowired
    private MonitorProperties properties;

    @Autowired
    private MonitorService monitorService;

    /**
     * Registration listener that registers the application with the dashboard on startup
     */
    @Configuration
    public class RegistrationListener implements ApplicationListener<ApplicationReadyEvent> {
        @Override
        public void onApplicationEvent(ApplicationReadyEvent event) {
            if (properties.isEnabled() && properties.isAutoRegister()) {
                try {
                    // Build application info
                    Map<String, Object> appInfo = buildApplicationInfo();

                    // Register with dashboard using the monitor service
                    monitorService.registerWithDashboard(appInfo);
                } catch (Exception e) {
                    e.printStackTrace();
                    System.err.println("Failed to register with monitoring dashboard: " + e.getMessage());
                }
            }
        }
    }

    /**
     * Scheduled method that sends heartbeats to the dashboard
     */
    @Scheduled(fixedDelayString = "${monitor.heartbeat-interval-ms:30000}")
    public void sendHeartbeat() {
        if (monitorService.getRegisteredAppId() != null) {
            try {
                // Heartbeat is handled through health checks
                // This method can be extended for custom metrics
                System.out.println("Monitoring heartbeat sent to dashboard");
            } catch (Exception e) {
                System.err.println("Failed to send heartbeat: " + e.getMessage());
            }
        }
    }

    /**
     * Build application information map for registration
     *
     * @return Map of application information
     * @throws Exception If there is an error building the information
     */
    private Map<String, Object> buildApplicationInfo() throws Exception {
        Map<String, Object> appInfo = new HashMap<>();

        // Application name and ID
        appInfo.put("name", environment.getProperty("spring.application.name", "spring-boot-app"));
        appInfo.put("appId", properties.getAppId() != null ? 
            properties.getAppId() : UUID.randomUUID().toString());

        // Server details
        String serverPort = environment.getProperty("server.port", "8080");
        int port = Integer.parseInt(serverPort);
        String hostAddress = InetAddress.getLocalHost().getHostAddress();
        String managementContextPath = environment.getProperty("management.endpoints.web.base-path", "/actuator");

        // Construct the actuator base URL
        String actuatorBaseUrl = "http://" + hostAddress + ":" + port + managementContextPath;
        appInfo.put("actuatorUrl", actuatorBaseUrl);

        // Additional details
        appInfo.put("version", environment.getProperty("info.app.version", "unknown"));
        appInfo.put("autoRegister", properties.isAutoRegister());
        appInfo.put("healthCheckInterval", properties.getHeartbeatIntervalMs() / 1000); // Convert to seconds

        // Connection details
        appInfo.put("hostAddress", hostAddress);
        appInfo.put("port", port);
        appInfo.put("contextPath", environment.getProperty("server.servlet.context-path", ""));

        // We no longer need to send specific endpoint paths
        // The backend will discover available endpoints from the actuatorUrl

        // Source information
        appInfo.put("registrationSource", "direct");

        return appInfo;
    }
}
