package com.example.bootmonitoring;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Service for interacting with the monitoring dashboard
 * 
 * This service provides methods for registering the application
 * with the monitoring dashboard and sending custom metrics.
 */
public class MonitorService {

    private final MonitorProperties properties;
    private final RestTemplate restTemplate;
    private String registeredAppId;
    private String hostAddress;

    /**
     * Constructor
     * 
     * @param properties Monitor configuration properties
     */
    public MonitorService(MonitorProperties properties) {
        this.properties = properties;
        this.restTemplate = new RestTemplate();
        
        try {
            this.hostAddress = InetAddress.getLocalHost().getHostAddress();
        } catch (UnknownHostException e) {
            this.hostAddress = "localhost";
        }
    }

    /**
     * Register application with the dashboard manually
     * 
     * This method can be used if auto-registration is disabled
     * or if you need to re-register the application.
     * 
     * @param appInfo Map of application information
     * @return The registered application ID
     */
    public String registerWithDashboard(Map<String, Object> appInfo) {
        try {
            // Build registration payload
            Map<String, Object> registration = new HashMap<>(appInfo);
            
            // Add required fields if not present
            if (!registration.containsKey("appId")) {
                registration.put("appId", properties.getAppId() != null ? 
                    properties.getAppId() : UUID.randomUUID().toString());
            }
            
            if (!registration.containsKey("hostAddress")) {
                registration.put("hostAddress", hostAddress);
            }
            
            // Add source information
            registration.put("registrationSource", "direct");

            // Register with dashboard
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(registration, headers);
            Map response = restTemplate.postForObject(
                    properties.getDashboardUrl() + "/api/register", 
                    request, 
                    Map.class);
            
            if (response != null && response.containsKey("appId")) {
                registeredAppId = (String) response.get("appId");
                return registeredAppId;
            } else {
                throw new RuntimeException("Failed to register with dashboard: no appId returned");
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to register with dashboard", e);
        }
    }
    
    /**
     * Send custom metrics to the dashboard
     * 
     * @param metrics Map of custom metrics
     */
    public void sendCustomMetrics(Map<String, Object> metrics) {
        if (registeredAppId == null) {
            throw new IllegalStateException("Application is not registered with the dashboard");
        }
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> payload = new HashMap<>(metrics);
            payload.put("appId", registeredAppId);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            restTemplate.postForObject(
                    properties.getDashboardUrl() + "/api/metrics/custom", 
                    request, 
                    Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send custom metrics", e);
        }
    }
    
    /**
     * Get the registered application ID
     * 
     * @return The registered application ID
     */
    public String getRegisteredAppId() {
        return registeredAppId;
    }
    
    /**
     * Set the registered application ID
     * This is usually called internally but can be used for testing
     * 
     * @param registeredAppId The registered application ID
     */
    public void setRegisteredAppId(String registeredAppId) {
        this.registeredAppId = registeredAppId;
    }
}