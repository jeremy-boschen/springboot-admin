package org.newtco.bootmonitoring;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Autoconfiguration for Spring Boot Monitor Client
 * <p>
 * This class automatically configures the monitoring client
 * when the 'obserra.enabled' property is set to true.
 */
@Configuration
@EnableScheduling
@EnableConfigurationProperties(MonitorProperties.class)
@ConditionalOnProperty(prefix = "obserra", name = "enabled", havingValue = "true")
@Import(SpringBootRegistrar.class)
public class MonitorAutoConfiguration {

    /**
     * Register the monitor service bean
     * 
     * @param properties Monitor configuration properties
     * @return The monitor service bean
     */
    @Bean
    @ConditionalOnMissingBean(MonitorService.class)
    public MonitorService monitorService(RestTemplateBuilder restTemplateBuilder, MonitorProperties properties) {
        return new MonitorService(restTemplateBuilder, properties);
    }
}