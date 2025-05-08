package org.newtco.obserra.shared.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Model representing a single metric measurement.
 * This class stores information about a measurement from a Spring Boot actuator metrics endpoint.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MetricMeasurement {

    @JsonProperty("statistic")
    private String statistic;

    @JsonProperty("value")
    private Number value;

    // Default constructor for Jackson
    public MetricMeasurement() {
    }

    // Constructor with all fields
    public MetricMeasurement(String statistic, Number value) {
        this.statistic = statistic;
        this.value = value;
    }

    // Getters and Setters

    public String getStatistic() {
        return statistic;
    }

    public MetricMeasurement setStatistic(String statistic) {
        this.statistic = statistic;
        return this;
    }

    public Number getValue() {
        return value;
    }

    public MetricMeasurement setValue(Number value) {
        this.value = value;
        return this;
    }

    @Override
    public String toString() {
        return "MetricMeasurement{" +
                "statistic='" + statistic + '\'' +
                ", value=" + value +
                '}';
    }
}
