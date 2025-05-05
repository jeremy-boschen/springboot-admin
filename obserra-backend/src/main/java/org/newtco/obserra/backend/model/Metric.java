package org.newtco.obserra.backend.model;

import java.time.LocalDateTime;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * Model representing a service metric.
 * This corresponds to the 'metrics' table in the schema.
 */
public class Metric {

    private Long id;
    private Long serviceId;
    private LocalDateTime timestamp = LocalDateTime.now();
    private Float memoryUsed;
    private Float memoryMax;
    private Float cpuUsage;
    private Integer errorCount = 0;
    private JsonNode metricData;

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getServiceId() {
        return serviceId;
    }

    public void setServiceId(Long serviceId) {
        this.serviceId = serviceId;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Float getMemoryUsed() {
        return memoryUsed;
    }

    public void setMemoryUsed(Float memoryUsed) {
        this.memoryUsed = memoryUsed;
    }

    public Float getMemoryMax() {
        return memoryMax;
    }

    public void setMemoryMax(Float memoryMax) {
        this.memoryMax = memoryMax;
    }

    public Float getCpuUsage() {
        return cpuUsage;
    }

    public void setCpuUsage(Float cpuUsage) {
        this.cpuUsage = cpuUsage;
    }

    public Integer getErrorCount() {
        return errorCount;
    }

    public void setErrorCount(Integer errorCount) {
        this.errorCount = errorCount;
    }

    public JsonNode getMetricData() {
        return metricData;
    }

    public void setMetricData(JsonNode metricData) {
        this.metricData = metricData;
    }
}
