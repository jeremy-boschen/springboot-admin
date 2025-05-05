package org.newtco.obserra.backend.controller;

import org.newtco.obserra.backend.model.Log;
import org.newtco.obserra.backend.model.Metric;
import org.newtco.obserra.backend.model.Service;
import org.newtco.obserra.backend.service.ActuatorDataCollectionService;
import org.newtco.obserra.backend.storage.Storage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Controller for metrics and logs.
 * This controller provides endpoints for retrieving metrics and logs for services.
 */
@RestController
@RequestMapping("/api")
public class MetricsAndLogsController {

    private static final Logger logger = LoggerFactory.getLogger(MetricsAndLogsController.class);

    private final Storage storage;
    private final ActuatorDataCollectionService dataCollectionService;

    @Autowired
    public MetricsAndLogsController(
            Storage storage,
            ActuatorDataCollectionService dataCollectionService) {
        this.storage = storage;
        this.dataCollectionService = dataCollectionService;
    }

    /**
     * Get metrics for a specific service.
     *
     * @param id the service ID
     * @param limit the maximum number of metrics to return (optional, default 10)
     * @return the metrics for the specified service
     */
    @GetMapping("/services/{id}/metrics")
    public ResponseEntity<?> getServiceMetrics(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "10") int limit) {
        try {
            Optional<Service> service = storage.getService(id);
            if (!service.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Service not found"));
            }

            List<Metric> metrics = storage.getMetricsForService(id, limit);

            // Format metrics for the frontend
            Map<String, Object> formattedMetrics = formatMetricsForFrontend(metrics);

            return ResponseEntity.ok(formattedMetrics);
        } catch (Exception e) {
            logger.error("Error fetching metrics", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch metrics"));
        }
    }

    /**
     * Get logs for a specific service.
     *
     * @param id the service ID
     * @param limit the maximum number of logs to return (optional, default 100)
     * @return the logs for the specified service
     */
    @GetMapping("/services/{id}/logs")
    public ResponseEntity<?> getServiceLogs(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "100") int limit) {
        try {
            Optional<Service> service = storage.getService(id);
            if (!service.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Service not found"));
            }

            List<Log> logs = storage.getLogsForService(id, limit);

            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            logger.error("Error fetching logs", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch logs"));
        }
    }

    /**
     * Trigger a health check for a specific service.
     *
     * @param id the service ID
     * @return the updated service status
     */
    @PostMapping("/services/{id}/health-check")
    public ResponseEntity<?> triggerHealthCheck(@PathVariable Long id) {
        try {
            Optional<Service> serviceOpt = storage.getService(id);
            if (!serviceOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Service not found"));
            }

            Service service = serviceOpt.get();
            boolean success = dataCollectionService.collectServiceData(service);

            // Get the updated service
            serviceOpt = storage.getService(id);
            if (!serviceOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Service not found after health check"));
            }

            service = serviceOpt.get();

            return ResponseEntity.ok(Map.of(
                    "id", service.getId(),
                    "name", service.getName(),
                    "status", service.getStatus(),
                    "lastSeen", service.getLastSeen()
            ));
        } catch (Exception e) {
            logger.error("Error triggering health check", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to trigger health check"));
        }
    }

    /**
     * Trigger metrics collection for a specific service.
     *
     * @param id the service ID
     * @return the collected metrics
     */
    @PostMapping("/services/{id}/collect-metrics")
    public ResponseEntity<?> triggerMetricsCollection(@PathVariable Long id) {
        try {
            Optional<Service> serviceOpt = storage.getService(id);
            if (!serviceOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Service not found"));
            }

            Service service = serviceOpt.get();
            boolean success = dataCollectionService.collectServiceData(service);

            if (!success) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Failed to collect metrics"));
            }

            // Get the latest metrics
            List<Metric> metrics = storage.getMetricsForService(id, 1);
            if (metrics.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "No metrics found after collection"));
            }

            return ResponseEntity.ok(metrics.get(0));
        } catch (Exception e) {
            logger.error("Error triggering metrics collection", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to trigger metrics collection"));
        }
    }

    /**
     * Trigger logs collection for a specific service.
     *
     * @param id the service ID
     * @return the collected logs
     */
    @PostMapping("/services/{id}/collect-logs")
    public ResponseEntity<?> triggerLogsCollection(@PathVariable Long id) {
        try {
            Optional<Service> serviceOpt = storage.getService(id);
            if (!serviceOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Service not found"));
            }

            Service service = serviceOpt.get();
            boolean success = dataCollectionService.collectServiceData(service);

            if (!success) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Failed to collect logs"));
            }

            // Get the latest logs
            List<Log> logs = storage.getLogsForService(id, 10);

            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            logger.error("Error triggering logs collection", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to trigger logs collection"));
        }
    }

    /**
     * Format metrics for the frontend.
     *
     * @param metrics the metrics to format
     * @return a map containing formatted metrics
     */
    private Map<String, Object> formatMetricsForFrontend(List<Metric> metrics) {
        Map<String, Object> result = new HashMap<>();

        if (metrics.isEmpty()) {
            // Return empty metrics structure
            Map<String, Object> memoryMap = new HashMap<>();
            memoryMap.put("used", 0);
            memoryMap.put("max", 0);
            memoryMap.put("trend", List.of());

            Map<String, Object> cpuMap = new HashMap<>();
            cpuMap.put("used", 0);
            cpuMap.put("max", 1);
            cpuMap.put("trend", List.of());

            Map<String, Object> errorsMap = new HashMap<>();
            errorsMap.put("count", 0);
            errorsMap.put("trend", List.of());

            result.put("memory", memoryMap);
            result.put("cpu", cpuMap);
            result.put("errors", errorsMap);

            return result;
        }

        // Memory metrics
        Map<String, Object> memoryMap = new HashMap<>();
        memoryMap.put("used", Math.round(metrics.get(0).getMemoryUsed()));
        memoryMap.put("max", Math.round(metrics.get(0).getMemoryMax()));

        List<Float> memoryTrend = metrics.stream()
                .map(m -> m.getMemoryUsed() / m.getMemoryMax() * 100)
                .collect(Collectors.toList());
        memoryMap.put("trend", memoryTrend);

        // CPU metrics
        Map<String, Object> cpuMap = new HashMap<>();
        cpuMap.put("used", metrics.get(0).getCpuUsage());
        cpuMap.put("max", 1);

        List<Float> cpuTrend = metrics.stream()
                .map(m -> m.getCpuUsage() * 100)
                .collect(Collectors.toList());
        cpuMap.put("trend", cpuTrend);

        // Error metrics
        Map<String, Object> errorsMap = new HashMap<>();
        int totalErrors = metrics.stream()
                .mapToInt(Metric::getErrorCount)
                .sum();
        errorsMap.put("count", totalErrors);

        List<Integer> errorTrend = metrics.stream()
                .map(Metric::getErrorCount)
                .collect(Collectors.toList());
        errorsMap.put("trend", errorTrend);

        result.put("memory", memoryMap);
        result.put("cpu", cpuMap);
        result.put("errors", errorsMap);

        return result;
    }
}
