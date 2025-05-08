package org.newtco.obserra.backend.collector.actuator;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.newtco.obserra.backend.model.ActuatorEndpoint;
import org.newtco.obserra.backend.model.Metric;
import org.newtco.obserra.backend.model.Service;
import org.newtco.obserra.backend.model.ServiceStatus;
import org.newtco.obserra.backend.storage.Storage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Collector for metrics from the Spring Boot actuator metrics endpoint.
 */
@Component
public class MetricsEndpointCollector implements ActuatorCollector {

    private static final Logger logger = LoggerFactory.getLogger(MetricsEndpointCollector.class);
    private static final String ENDPOINT_TYPE = "metrics";

    private final Storage storage;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Autowired
    public MetricsEndpointCollector(
            Storage storage,
            RestTemplateBuilder restTemplateBuilder,
            ObjectMapper objectMapper,
            @Value("${obserra.metrics.timeout-ms:5000}") int metricsTimeoutMs) {
        this.storage = storage;
        this.objectMapper = objectMapper;

        // Configure RestTemplate with timeout
        this.restTemplate = restTemplateBuilder
                .connectTimeout(Duration.ofMillis(metricsTimeoutMs))
                .readTimeout(Duration.ofMillis(metricsTimeoutMs))
                .build();
    }

    @Override
    public String getEndpointType() {
        return ENDPOINT_TYPE;
    }

    @Override
    public boolean canHandle(ActuatorEndpoint endpoint) {
        return endpoint != null && ENDPOINT_TYPE.equals(endpoint.getType());
    }

    @Override
    public boolean collectData(Service service, ActuatorEndpoint endpoint) {
        logger.debug("Collecting metrics for service: {} ({})", service.getName(), service.getId());

        try {
            // Collect JVM metrics
            JsonNode metricData = collectJvmMetrics(service, endpoint);
            if (metricData == null) {
                logger.warn("Failed to collect JVM metrics for service {}", service.getName());
                // Update service status to DOWN if metrics collection failed
                updateServiceStatus(service, ServiceStatus.DOWN);
                return false;
            }

            // Create and store the metric
            Metric metric = new Metric();
            metric.setServiceId(service.getId());
            metric.setMemoryUsed(metricData.path("memory").path("used").floatValue());
            metric.setMemoryMax(metricData.path("memory").path("max").floatValue());
            metric.setCpuUsage(metricData.path("cpu").path("usage").floatValue());
            metric.setErrorCount(metricData.path("errors").intValue());
            metric.setMetricData(metricData);

            storage.createMetric(metric);
            logger.debug("Stored metrics for service {}", service.getName());

            // Update service status to UP if metrics collection succeeded
            updateServiceStatus(service, ServiceStatus.UP);
            return true;
        } catch (Exception e) {
            logger.error("Error collecting metrics for service {}: {}", service.getName(), e.getMessage());
            // Update service status to DOWN if metrics collection failed
            updateServiceStatus(service, ServiceStatus.DOWN);
            return false;
        }
    }

    /**
     * Collect JVM metrics from a service's actuator endpoints.
     *
     * @param service The service to collect metrics from
     * @param endpoint The metrics endpoint
     * @return A JsonNode containing the collected metrics, or null if collection failed
     */
    private JsonNode collectJvmMetrics(Service service, ActuatorEndpoint endpoint) {
        String baseUrl = endpoint.getHref();
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }

        try {
            // Create a root node for all metrics
            ObjectNode rootNode = objectMapper.createObjectNode();

            // Memory metrics
            float memoryUsed = collectMemoryMetric(baseUrl, "jvm.memory.used");
            float memoryMax = collectMemoryMetric(baseUrl, "jvm.memory.max");

            ObjectNode memoryNode = objectMapper.createObjectNode();
            memoryNode.put("used", memoryUsed);
            memoryNode.put("max", memoryMax);
            rootNode.set("memory", memoryNode);

            // CPU metrics
            float cpuUsage = collectCpuMetric(baseUrl, "process.cpu.usage");

            ObjectNode cpuNode = objectMapper.createObjectNode();
            cpuNode.put("usage", cpuUsage);
            rootNode.set("cpu", cpuNode);

            // Error metrics - try to get from error count or http error metrics
            int errorCount = collectErrorMetric(baseUrl);
            rootNode.put("errors", errorCount);

            return rootNode;
        } catch (Exception e) {
            logger.error("Error collecting JVM metrics for service {}: {}", service.getName(), e.getMessage());
            return null;
        }
    }

    /**
     * Collect a memory metric from a service's actuator endpoint.
     *
     * @param baseUrl The base URL of the service's metrics endpoint
     * @param metricName The name of the metric to collect
     * @return The value of the metric, or 0 if collection failed
     */
    private float collectMemoryMetric(String baseUrl, String metricName) {
        try {
            String url = baseUrl + "/" + metricName;
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> measurements = (List<Map<String, Object>>) response.getBody().get("measurements");
                if (measurements != null && !measurements.isEmpty()) {
                    return ((Number) measurements.get(0).get("value")).floatValue();
                }
            }
        } catch (RestClientException e) {
            logger.warn("Failed to collect memory metric {}: {}", metricName, e.getMessage());
        }

        return 0f;
    }

    /**
     * Collect a CPU metric from a service's actuator endpoint.
     *
     * @param baseUrl The base URL of the service's metrics endpoint
     * @param metricName The name of the metric to collect
     * @return The value of the metric, or 0 if collection failed
     */
    private float collectCpuMetric(String baseUrl, String metricName) {
        try {
            String url = baseUrl + "/" + metricName;
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> measurements = (List<Map<String, Object>>) response.getBody().get("measurements");
                if (measurements != null && !measurements.isEmpty()) {
                    return ((Number) measurements.get(0).get("value")).floatValue();
                }
            }
        } catch (RestClientException e) {
            logger.warn("Failed to collect CPU metric {}: {}", metricName, e.getMessage());
        }

        return 0f;
    }

    /**
     * Collect error metrics from a service's actuator endpoint.
     *
     * @param baseUrl The base URL of the service's metrics endpoint
     * @return The number of errors, or 0 if collection failed
     */
    private int collectErrorMetric(String baseUrl) {
        int errorCount = 0;

        // Try to get server error count
        try {
            String url = baseUrl + "/http.server.requests";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> availableTags = (List<Map<String, Object>>) response.getBody().get("availableTags");
                if (availableTags != null) {
                    for (Map<String, Object> tag : availableTags) {
                        if ("status".equals(tag.get("tag"))) {
                            List<String> values = (List<String>) tag.get("values");
                            for (String value : values) {
                                if (value.startsWith("5") || value.startsWith("4")) {
                                    // This is a 4xx or 5xx status code, try to get the count
                                    errorCount += collectHttpErrorCount(baseUrl, value);
                                }
                            }
                            break;
                        }
                    }
                }
            }
        } catch (RestClientException e) {
            logger.warn("Failed to collect HTTP error metrics: {}", e.getMessage());
        }

        return errorCount;
    }

    /**
     * Collect HTTP error count for a specific status code.
     *
     * @param baseUrl The base URL of the service's metrics endpoint
     * @param statusCode The HTTP status code to collect errors for
     * @return The number of errors for the specified status code, or 0 if collection failed
     */
    private int collectHttpErrorCount(String baseUrl, String statusCode) {
        try {
            String url = baseUrl + "/http.server.requests?tag=status:" + statusCode;
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> measurements = (List<Map<String, Object>>) response.getBody().get("measurements");
                if (measurements != null && !measurements.isEmpty()) {
                    for (Map<String, Object> measurement : measurements) {
                        if ("COUNT".equals(measurement.get("statistic"))) {
                            return ((Number) measurement.get("value")).intValue();
                        }
                    }
                }
            }
        } catch (RestClientException e) {
            logger.warn("Failed to collect HTTP error count for status {}: {}", statusCode, e.getMessage());
        }

        return 0;
    }

    /**
     * Update the status of a service.
     *
     * @param service The service to update
     * @param status The new status
     */
    private void updateServiceStatus(Service service, ServiceStatus status) {
        if (service.getStatus() != status) {
            logger.info("Service {} status changed from {} to {}", 
                    service.getName(), service.getStatus(), status);
        }

        storage.updateServiceStatus(service.getId(), status);
        storage.updateServiceLastSeen(service.getId());
    }
}