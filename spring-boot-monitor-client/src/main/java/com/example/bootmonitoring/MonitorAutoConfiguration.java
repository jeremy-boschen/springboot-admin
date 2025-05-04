package com.example.bootmonitoring;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Auto-configuration for Spring Boot Monitor Client
 * 
 * This class automatically configures the monitoring client
 * when the 'monitor.enabled' property is set to true.
 */
@Configuration
@EnableScheduling
@EnableConfigurationProperties(MonitorProperties.class)
@ConditionalOnProperty(prefix = "monitor", name = "enabled", havingValue = "true")
@Import(SpringBootRegistrar.class)
public class MonitorAutoConfiguration {

    /**
     * Register the monitor service bean
     * 
     * @param properties Monitor configuration properties
     * @return The monitor service bean
     */
    @Bean
    public MonitorService monitorService(MonitorProperties properties) {
        return new MonitorService(properties);
    }
}