package org.newtco.obserra.backend.model;

import java.time.LocalDateTime;

/**
 * Model representing a service log entry.
 * This corresponds to the 'logs' table in the schema.
 */
public class Log {

    private Long id;
    private Long serviceId;
    private LocalDateTime timestamp = LocalDateTime.now();
    private String level = "INFO";
    private String message;

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

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
