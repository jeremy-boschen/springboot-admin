package org.newtco.obserra.shared.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Duration;

public class ServiceRegistration {
    /**
     * Request payload for registering a service with the monitoring dashboard. This class represents the data sent from
     * the Spring Boot application to the backend.
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Request {

        @JsonProperty("name")
        private String name;

        @JsonProperty("appId")
        private String appId;

        @JsonProperty("version")
        private String version;

        @JsonProperty("actuatorUrl")
        private String actuatorUrl;

        @JsonProperty("actuatorPort")
        private int actuatorPort;

        @JsonProperty("checkInterval")
        private Duration checkInterval;

        @JsonProperty("autoRegister")
        private boolean autoRegister;

        // Default constructor for Jackson
        public Request() {
        }

        // Getters and Setters

        public String getName() {
            return name;
        }

        public Request setName(String name) {
            this.name = name;
            return this;
        }

        public String getActuatorUrl() {
            return actuatorUrl;
        }

        public Request setActuatorUrl(String actuatorUrl) {
            this.actuatorUrl = actuatorUrl;
            return this;
        }

        public int getActuatorPort() {
            return actuatorPort;
        }

        public Request setActuatorPort(int actuatorPort) {
            this.actuatorPort = actuatorPort;
            return this;
        }

        public String getAppId() {
            return appId;
        }

        public Request setAppId(String appId) {
            this.appId = appId;
            return this;
        }

        public String getVersion() {
            return version;
        }

        public Request setVersion(String version) {
            this.version = version;
            return this;
        }

        public Duration getCheckInterval() {
            return checkInterval;
        }

        public Request setCheckInterval(Duration checkInterval) {
            this.checkInterval = checkInterval;
            return this;
        }

        public boolean isAutoRegister() {
            return autoRegister;
        }

        public Request setAutoRegister(Boolean autoRegister) {
            this.autoRegister = autoRegister;
            return this;
        }


        @Override
        public String toString() {
            return "Request{" + "name='" + name + '\'' +
                   ", appId='" + appId + '\'' +
                   ", version='" + version + '\'' +
                   ", actuatorUrl='" + actuatorUrl + '\'' +
                   ", actuatorPort=" + actuatorPort +
                   ", checkInterval=" + checkInterval +
                   ", autoRegister=" + autoRegister +
                   '}';
        }
    }

    /**
     * Response payload for registering a service with the monitoring dashboard. This class represents the data returned
     * from the backend to the Spring Boot application.
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Response {

        @JsonProperty("id")
        private String registrationId;


        // Default constructor for Jackson
        public Response() {
        }

        // Constructor with all fields
        public Response(String id) {
            this.registrationId = id;
        }

        // Getters and Setters

        public String getRegistrationId() {
            return registrationId;
        }

        public Response setRegistrationId(String registrationId) {
            this.registrationId = registrationId;
            return this;
        }
    }
}
