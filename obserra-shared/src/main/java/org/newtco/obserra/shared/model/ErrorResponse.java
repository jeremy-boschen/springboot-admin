package org.newtco.obserra.shared.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Standardized error response for API errors.
 * This class represents the error data returned from the backend to the client.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    @JsonProperty("error")
    private String error;

    @JsonProperty("details")
    private String details;

    @JsonProperty("status")
    private Integer status;

    // Default constructor for Jackson
    public ErrorResponse() {
    }

    // Constructor with error message
    public ErrorResponse(String error) {
        this.error = error;
    }

    // Constructor with error message and details
    public ErrorResponse(String error, String details) {
        this.error = error;
        this.details = details;
    }

    // Constructor with all fields
    public ErrorResponse(String error, String details, Integer status) {
        this.error = error;
        this.details = details;
        this.status = status;
    }

    // Getters and Setters

    public String getError() {
        return error;
    }

    public ErrorResponse setError(String error) {
        this.error = error;
        return this;
    }

    public String getDetails() {
        return details;
    }

    public ErrorResponse setDetails(String details) {
        this.details = details;
        return this;
    }

    public Integer getStatus() {
        return status;
    }

    public ErrorResponse setStatus(Integer status) {
        this.status = status;
        return this;
    }
}
