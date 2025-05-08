package org.newtco.obserra.shared.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Model representing a log entry from a Spring Boot application.
 * This class stores information about a log entry from the logfile endpoint.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LogEntry {

    @JsonProperty("timestamp")
    private String timestamp;

    @JsonProperty("level")
    private String level;

    @JsonProperty("thread")
    private String thread;

    @JsonProperty("message")
    private String message;

    @JsonProperty("logger")
    private String logger;

    // Default constructor for Jackson
    public LogEntry() {
    }

    // Constructor with level and message
    public LogEntry(String level, String message) {
        this.level = level;
        this.message = message;
    }

    // Constructor with all fields
    public LogEntry(String timestamp, String level, String thread, String message, String logger) {
        this.timestamp = timestamp;
        this.level = level;
        this.thread = thread;
        this.message = message;
        this.logger = logger;
    }

    // Getters and Setters

    public String getTimestamp() {
        return timestamp;
    }

    public LogEntry setTimestamp(String timestamp) {
        this.timestamp = timestamp;
        return this;
    }

    public String getLevel() {
        return level;
    }

    public LogEntry setLevel(String level) {
        this.level = level;
        return this;
    }

    public String getThread() {
        return thread;
    }

    public LogEntry setThread(String thread) {
        this.thread = thread;
        return this;
    }

    public String getMessage() {
        return message;
    }

    public LogEntry setMessage(String message) {
        this.message = message;
        return this;
    }

    public String getLogger() {
        return logger;
    }

    public LogEntry setLogger(String logger) {
        this.logger = logger;
        return this;
    }

    @Override
    public String toString() {
        return "LogEntry{" +
                "timestamp='" + timestamp + '\'' +
                ", level='" + level + '\'' +
                ", thread='" + thread + '\'' +
                ", message='" + message + '\'' +
                ", logger='" + logger + '\'' +
                '}';
    }
}
