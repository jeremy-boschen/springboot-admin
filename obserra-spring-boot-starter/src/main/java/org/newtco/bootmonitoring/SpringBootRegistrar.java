package org.newtco.bootmonitoring;

import org.newtco.obserra.shared.model.ServiceRegistration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationListener;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import java.util.UUID;

/**
 * Spring Boot Monitor Registration
 * <p>
 * This class automatically registers the Spring Boot application with the monitoring backend on startup and
 * periodically sends heartbeats to maintain the registration.
 */
@Configuration
public class SpringBootRegistrar {
    private static final Logger logger = LoggerFactory.getLogger(SpringBootRegistrar.class);

    public SpringBootRegistrar() {
        // No dependencies in constructor, they will be obtained from application events
    }

    /**
     * Registration listener that registers the application with the backend on startup
     * <p>
     * Note: Deregistration is handled automatically by the MonitorService's @PreDestroy method, which ensures that all
     * required beans are still available during deregistration. This happens before the context is fully closed,
     * avoiding potential issues with beans being unavailable during context shutdown.
     */
    @Configuration
    public static class RegistrationListener implements ApplicationListener<ApplicationReadyEvent> {

        @Override
        public void onApplicationEvent(ApplicationReadyEvent event) {
            var context           = event.getApplicationContext();
            var monitorProperties = context.getBean(MonitorProperties.class);

            if (monitorProperties.isEnabled() && monitorProperties.isAutoRegister()) {
                try {
                    // Register with the backend using the monitor service
                    context.getBean(MonitorService.class).registerWithBackend(buildRegistrationRequest(context, monitorProperties));
                } catch (Exception e) {
                    logger.error("Failed to register with monitoring backend {}", monitorProperties.getRegistrationServer(), e);
                }
            }
        }

        /**
         * Build application information as a ServiceRegistrationRequest for registration
         *
         * @param context The application context to get beans from
         *
         * @return ServiceRegistrationRequest with application information
         */
        private ServiceRegistration.Request buildRegistrationRequest(
                ApplicationContext context,
                MonitorProperties monitorProperties) {

            // Get required beans from context
            Environment env = context.getBean(Environment.class);

            var managementPath = env.getProperty("management.endpoints.web.base-path", "/actuator");
            var contextPath    = env.getProperty("server.servlet.context-path", "");
            if (!contextPath.isBlank()) {
                managementPath = contextPath + "/" + managementPath;
            }

            int managementPort = 8080;
            try {
                var port = env.getProperty("management.server.port", "");
                if (port.isBlank()) {
                    port = env.getProperty("server.port", "8080");
                }

                managementPort = Integer.parseInt(port);
            } catch (NumberFormatException e) {
                logger.error("Failed to parse management port from environment: {}", e.getMessage());
            }

            // Try to get a meaningful name
            var name = monitorProperties.getAppName();
            if (name.isBlank()) {
                env.getProperty("spring.application.name", "");
                if (name.isBlank()) {
                    name = env.getProperty("spring.application.id", "");
                    if (name.isBlank()) {
                        name = UUID.randomUUID().toString();
                        logger.warn("Unable to determine application name, using random UUID: {}", name);
                    }
                }
            }

            // Try to get a meaningful version
            var version = monitorProperties.getAppVersion();
            if (version.isBlank()) {
                env.getProperty("spring.application.version", "");
                if (version.isBlank()) {
                    version = System.getenv("APPLICATION_VERSION");
                    if (version.isBlank()) {
                        name = env.getProperty("git.tags", "");
                        if (!name.isBlank()) {
                            name = "git:" + name;
                        } else {
                            name = env.getProperty("git.commit.id.abbrev", "");
                            if (!name.isBlank()) {
                                name = "git:" + name;
                            } else {
                                name = env.getProperty("git.commit.id", "");
                                if (!name.isBlank()) {
                                    name = "git:" + (name.length() > 7 ? name.substring(0, 7) : name);
                                } else {
                                    name = env.getProperty("git.commit.id.full", "");
                                    if (!name.isBlank()) {
                                        name = "git:" + (name.length() > 7 ? name.substring(0, 7) : name);
                                    } else {
                                        version = System.getenv("IMAGE_TAG");
                                        if (version != null && !version.isBlank()) {
                                            version = "image-tag:" + version;
                                        } else {
                                            version = "unknown";
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Build request using method chaining
            return new ServiceRegistration.Request()
                    .setName(name)
                    .setAppId(monitorProperties.getAppId())
                    .setVersion(version)
                    .setActuatorUrl(managementPath)
                    .setActuatorPort(managementPort)
                    .setCheckInterval(monitorProperties.getCheckInterval())
                    .setAutoRegister(monitorProperties.isAutoRegister());
        }

    }
}
