package org.newtco.obserra.backend.model;

/**
 * Model representing a logger and its configuration.
 * This corresponds to the logger information returned by the Spring Boot Actuator /loggers endpoint.
 */
public class Logger {

    private String name;
    private LoggerLevel configuredLevel;
    private LoggerLevel effectiveLevel;

    // Getters and Setters

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LoggerLevel getConfiguredLevel() {
        return configuredLevel;
    }

    public void setConfiguredLevel(LoggerLevel configuredLevel) {
        this.configuredLevel = configuredLevel;
    }

    public LoggerLevel getEffectiveLevel() {
        return effectiveLevel;
    }

    public void setEffectiveLevel(LoggerLevel effectiveLevel) {
        this.effectiveLevel = effectiveLevel;
    }
}