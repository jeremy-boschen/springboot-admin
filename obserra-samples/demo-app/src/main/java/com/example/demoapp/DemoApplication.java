package com.example.demoapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

/**
 * Example Spring Boot application that demonstrates how to use the monitoring client
 * 
 * To see this application in action:
 * 1. Build and run the Spring Boot Monitoring Dashboard
 * 2. Include the boot-monitoring-client JAR in your application
 * 3. Add the necessary configuration to your application.properties
 * 4. Run this application
 * 5. View the dashboard to see the application's metrics, logs, and health status
 */
@EnableScheduling  // Required for scheduled heartbeats
@SpringBootApplication
public class DemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }

    /**
     * Example REST controller that provides endpoints for testing
     */
    @RestController
    public static class ExampleController {
        
        private final Random random = new Random();
        
        /**
         * Simple hello endpoint
         */
        @GetMapping("/hello")
        public Map<String, Object> hello() {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Hello from monitored Spring Boot application!");
            response.put("timestamp", System.currentTimeMillis());
            return response;
        }
        
        /**
         * Endpoint that randomly generates errors
         * Useful for testing error metrics in the dashboard
         */
        @GetMapping("/random-error")
        public Map<String, Object> randomError() {
            // Generate errors ~20% of the time
            if (random.nextInt(5) == 0) {
                throw new RuntimeException("Random error occurred");
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "No error this time!");
            response.put("timestamp", System.currentTimeMillis());
            return response;
        }
        
        /**
         * Memory-intensive endpoint
         * Useful for testing memory metrics in the dashboard
         */
        @GetMapping("/memory-test")
        public Map<String, Object> memoryTest() {
            // Create a large temporary array to consume memory
            byte[] memoryConsumer = new byte[1024 * 1024 * 10]; // 10MB
            
            // Fill with random data
            random.nextBytes(memoryConsumer);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Memory test complete");
            response.put("bytesAllocated", memoryConsumer.length);
            
            // Calculate memory usage
            Runtime runtime = Runtime.getRuntime();
            long totalMemory = runtime.totalMemory();
            long freeMemory = runtime.freeMemory();
            long usedMemory = totalMemory - freeMemory;
            
            response.put("totalMemoryMB", totalMemory / (1024 * 1024));
            response.put("usedMemoryMB", usedMemory / (1024 * 1024));
            response.put("freeMemoryMB", freeMemory / (1024 * 1024));
            
            return response;
        }
        
        /**
         * CPU-intensive endpoint
         * Useful for testing CPU metrics in the dashboard
         */
        @GetMapping("/cpu-test")
        public Map<String, Object> cpuTest() {
            long startTime = System.currentTimeMillis();
            
            // Perform a CPU-intensive calculation
            double result = 0;
            for (int i = 0; i < 10000000; i++) {
                result += Math.sin(i) * Math.cos(i);
            }
            
            long duration = System.currentTimeMillis() - startTime;
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "CPU test complete");
            response.put("calculationResult", result);
            response.put("durationMs", duration);
            
            return response;
        }
    }
}