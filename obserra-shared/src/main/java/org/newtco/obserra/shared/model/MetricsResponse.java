package org.newtco.obserra.shared.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.List;

/**
 * Response payload for metrics data from a Spring Boot actuator metrics endpoint.
 * This class represents the data returned from a specific metric endpoint.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MetricsResponse {

    @JsonProperty("name")
    private String name;

    @JsonProperty("description")
    private String description;

    @JsonProperty("baseUnit")
    private String baseUnit;

    @JsonProperty("measurements")
    private List<MetricMeasurement> measurements = new ArrayList<>();

    @JsonProperty("availableTags")
    private List<MetricTag> availableTags = new ArrayList<>();

    // Default constructor for Jackson
    public MetricsResponse() {
    }

    // Constructor with name
    public MetricsResponse(String name) {
        this.name = name;
    }

    // Getters and Setters

    public String getName() {
        return name;
    }

    public MetricsResponse setName(String name) {
        this.name = name;
        return this;
    }

    public String getDescription() {
        return description;
    }

    public MetricsResponse setDescription(String description) {
        this.description = description;
        return this;
    }

    public String getBaseUnit() {
        return baseUnit;
    }

    public MetricsResponse setBaseUnit(String baseUnit) {
        this.baseUnit = baseUnit;
        return this;
    }

    public List<MetricMeasurement> getMeasurements() {
        return measurements;
    }

    public MetricsResponse setMeasurements(List<MetricMeasurement> measurements) {
        this.measurements = measurements;
        return this;
    }

    public MetricsResponse addMeasurement(MetricMeasurement measurement) {
        if (this.measurements == null) {
            this.measurements = new ArrayList<>();
        }
        this.measurements.add(measurement);
        return this;
    }

    public List<MetricTag> getAvailableTags() {
        return availableTags;
    }

    public MetricsResponse setAvailableTags(List<MetricTag> availableTags) {
        this.availableTags = availableTags;
        return this;
    }

    public MetricsResponse addAvailableTag(MetricTag tag) {
        if (this.availableTags == null) {
            this.availableTags = new ArrayList<>();
        }
        this.availableTags.add(tag);
        return this;
    }

    /**
     * Inner class representing a metric tag
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class MetricTag {
        @JsonProperty("tag")
        private String tag;

        @JsonProperty("values")
        private List<String> values = new ArrayList<>();

        // Default constructor for Jackson
        public MetricTag() {
        }

        // Constructor with tag
        public MetricTag(String tag) {
            this.tag = tag;
        }

        // Constructor with tag and values
        public MetricTag(String tag, List<String> values) {
            this.tag = tag;
            this.values = values;
        }

        // Getters and Setters

        public String getTag() {
            return tag;
        }

        public MetricTag setTag(String tag) {
            this.tag = tag;
            return this;
        }

        public List<String> getValues() {
            return values;
        }

        public MetricTag setValues(List<String> values) {
            this.values = values;
            return this;
        }

        public MetricTag addValue(String value) {
            if (this.values == null) {
                this.values = new ArrayList<>();
            }
            this.values.add(value);
            return this;
        }
    }
}
