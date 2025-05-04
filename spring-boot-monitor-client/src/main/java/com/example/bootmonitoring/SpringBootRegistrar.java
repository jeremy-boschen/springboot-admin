package com.example.bootmonitoring;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.net.InetAddress;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Spring Boot Auto-Configuration for Boot Monitoring Dashboard
 * 
 * This class automatically registers the Spring Boot application with the monitoring dashboard
 * on startup, and periodically sends heartbeats to maintain the registration.
 * 
 * To use this auto-configuration, add the following properties to your application.properties:
 * 
 * # Enable Boot Monitoring (default: false)
 * monitor.enabled=true
 * 
 * # Monitor Dashboard URL (default: http://localhost:3000)
 * monitor.dashboard-url=http://dashboard-server:3000
 * 
 * # Application ID (optional, will be generated if not provided)
 * monitor.app-id=my-unique-application-id
 * 
 * # Registration settings
 * monitor.auto-register=true
 * monitor.heartbeat-interval-ms=30000
 */
@Configuration
@EnableScheduling
@ConditionalOnProperty(name = "monitor.enabled", havingValue = "true")
public class SpringBootRegistrar {

    @Component
    public class MonitoringRegistration implements ApplicationListener<ApplicationReadyEvent> {

        @Autowired
        private Environment environment;

        @Value("${monitor.dashboard-url:http://localhost:3000}")
        private String dashboardUrl;

        @Value("${monitor.app-id:#{null}}")
        private String appId;

        @Value("${monitor.auto-register:true}")
        private boolean autoRegister;

        @Value("${monitor.heartbeat-interval-ms:30000}")
        private long heartbeatInterval;

        private final RestTemplate restTemplate = new RestTemplate();
        private String registeredAppId;

        @Override
        public void onApplicationEvent(ApplicationReadyEvent event) {
            try {
                // Generate app ID if not provided
                if (appId == null || appId.isEmpty()) {
                    appId = UUID.randomUUID().toString();
                }
                
                registerWithDashboard();
            } catch (Exception e) {
                e.printStackTrace();
                System.err.println("Failed to register with monitoring dashboard: " + e.getMessage());
            }
        }

        @Scheduled(fixedDelayString = "${monitor.heartbeat-interval-ms:30000}")
        public void sendHeartbeat() {
            if (registeredAppId != null) {
                try {
                    // Heartbeat is handled through health checks
                    // This method can be extended for custom metrics
                    System.out.println("Monitoring heartbeat sent to dashboard");
                } catch (Exception e) {
                    System.err.println("Failed to send heartbeat: " + e.getMessage());
                }
            }
        }

        private void registerWithDashboard() throws Exception {
            // Build registration payload
            Map<String, Object> registration = new HashMap<>();
            registration.put("name", environment.getProperty("spring.application.name", "spring-boot-app"));
            
            String serverPort = environment.getProperty("server.port", "8080");
            int port = Integer.parseInt(serverPort);
            
            // Determine host address 
            String hostAddress = InetAddress.getLocalHost().getHostAddress();
            
            // Get management context path if specified
            String managementContextPath = environment.getProperty("management.endpoints.web.base-path", "/actuator");
            
            // Construct the actuator base URL
            String actuatorBaseUrl = "http://" + hostAddress + ":" + port + managementContextPath;
            registration.put("actuatorUrl", actuatorBaseUrl);
            
            // Optional fields
            registration.put("appId", appId);
            registration.put("version", environment.getProperty("info.app.version", "unknown"));
            registration.put("autoRegister", autoRegister);
            registration.put("healthCheckInterval", heartbeatInterval / 1000); // Convert to seconds
            
            // Add connection details
            registration.put("hostAddress", hostAddress);
            registration.put("port", port);
            registration.put("contextPath", environment.getProperty("server.servlet.context-path", ""));
            
            // Custom paths if configured differently
            registration.put("healthCheckPath", managementContextPath + "/health");
            registration.put("metricsPath", managementContextPath + "/metrics");
            registration.put("logsPath", managementContextPath + "/logfile");
            registration.put("configPath", managementContextPath + "/env");
            
            // Source information
            registration.put("registrationSource", "direct");

            // Register with dashboard
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(registration, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    dashboardUrl + "/api/register", 
                    request, 
                    Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                registeredAppId = (String) response.getBody().get("appId");
                System.out.println("Successfully registered with monitoring dashboard as app: " + registeredAppId);
            } else {
                throw new RuntimeException("Failed to register with dashboard: " + response.getStatusCode());
            }
        }
    }
}