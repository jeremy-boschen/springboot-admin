package org.newtco.obserra.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main application class for the Obserra Backend.
 * 
 * This Spring Boot application provides monitoring and management capabilities
 * for Spring Boot applications through their Actuator endpoints.
 */
@SpringBootApplication
@EnableScheduling
public class ObserraBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ObserraBackendApplication.class, args);
    }
}