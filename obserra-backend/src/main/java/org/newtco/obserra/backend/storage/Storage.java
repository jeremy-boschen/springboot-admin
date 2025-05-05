package org.newtco.obserra.backend.storage;

import org.newtco.obserra.backend.model.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Interface for storage operations.
 * This provides a common interface for different storage implementations (in-memory, database, etc.)
 */
public interface Storage {
    // User methods
    Optional<User> getUser(Long id);
    Optional<User> getUserByUsername(String username);
    User createUser(User user);

    // Service methods
    List<Service> getAllServices();
    Optional<Service> getService(Long id);
    Optional<Service> getServiceByPodName(String podName);
    Optional<Service> getServiceByAppId(String appId);
    Service createService(Service service);
    Service updateService(Long id, Service service);
    Service updateServiceStatus(Long id, ServiceStatus status);
    Service updateServiceLastSeen(Long id);
    void deleteService(Long id);

    // Service registration methods
    Service registerService(Service registration);

    // Health check methods
    List<Service> getServicesForHealthCheck(int maxAgeSeconds);

    // Metrics methods
    List<Metric> getMetricsForService(Long serviceId, int limit);
    Metric createMetric(Metric metric);

    // Logs methods
    List<Log> getLogsForService(Long serviceId, int limit);
    Log createLog(Log log);

    // Configuration methods
    List<ConfigProperty> getConfigPropertiesForService(Long serviceId);
    Optional<ConfigProperty> getConfigProperty(Long id);
    ConfigProperty createConfigProperty(ConfigProperty property);
    ConfigProperty updateConfigProperty(Long id, ConfigProperty property);
    void deleteConfigProperty(Long id);
}