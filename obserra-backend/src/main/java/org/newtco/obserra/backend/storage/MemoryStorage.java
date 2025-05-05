package org.newtco.obserra.backend.storage;

import org.newtco.obserra.backend.model.*;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.util.UUID;

/**
 * In-memory implementation of the Storage interface.
 * This class stores all data in memory using Maps.
 */
public class MemoryStorage implements Storage {
    private final Map<Long, User> users = new ConcurrentHashMap<>();
    private final Map<Long, Service> services = new ConcurrentHashMap<>();
    private final Map<Long, List<Metric>> metrics = new ConcurrentHashMap<>();
    private final Map<Long, List<Log>> logs = new ConcurrentHashMap<>();
    private final Map<Long, List<ConfigProperty>> configProperties = new ConcurrentHashMap<>();

    private long currentUserId = 1;
    private long currentServiceId = 1;
    private long currentMetricId = 1;
    private long currentLogId = 1;
    private long currentConfigPropertyId = 1;

    // User methods
    @Override
    public Optional<User> getUser(Long id) {
        return Optional.ofNullable(users.get(id));
    }

    @Override
    public Optional<User> getUserByUsername(String username) {
        return users.values().stream()
                .filter(user -> user.getUsername().equals(username))
                .findFirst();
    }

    @Override
    public User createUser(User user) {
        user.setId(currentUserId++);
        users.put(user.getId(), user);
        return user;
    }

    // Service methods
    @Override
    public List<Service> getAllServices() {
        return new ArrayList<>(services.values());
    }

    @Override
    public Optional<Service> getService(Long id) {
        return Optional.ofNullable(services.get(id));
    }

    @Override
    public Optional<Service> getServiceByPodName(String podName) {
        return services.values().stream()
                .filter(service -> podName.equals(service.getPodName()))
                .findFirst();
    }

    @Override
    public Optional<Service> getServiceByAppId(String appId) {
        return services.values().stream()
                .filter(service -> appId.equals(service.getAppId()))
                .findFirst();
    }

    @Override
    public Service createService(Service service) {
        service.setId(currentServiceId++);
        service.setLastUpdated(LocalDateTime.now());
        services.put(service.getId(), service);
        
        // Initialize empty lists for metrics and logs
        metrics.put(service.getId(), new ArrayList<>());
        logs.put(service.getId(), new ArrayList<>());
        configProperties.put(service.getId(), new ArrayList<>());
        
        return service;
    }

    @Override
    public Service updateService(Long id, Service updatedService) {
        Service existingService = services.get(id);
        if (existingService == null) {
            throw new IllegalArgumentException("Service not found with id: " + id);
        }
        
        updatedService.setId(id);
        updatedService.setLastUpdated(LocalDateTime.now());
        services.put(id, updatedService);
        return updatedService;
    }

    @Override
    public Service updateServiceStatus(Long id, ServiceStatus status) {
        Service service = services.get(id);
        if (service == null) {
            throw new IllegalArgumentException("Service not found with id: " + id);
        }
        
        service.setStatus(status);
        service.setLastUpdated(LocalDateTime.now());
        return service;
    }

    @Override
    public Service updateServiceLastSeen(Long id) {
        Service service = services.get(id);
        if (service == null) {
            throw new IllegalArgumentException("Service not found with id: " + id);
        }
        
        service.setLastSeen(LocalDateTime.now());
        return service;
    }

    @Override
    public void deleteService(Long id) {
        services.remove(id);
        metrics.remove(id);
        logs.remove(id);
        configProperties.remove(id);
    }

    // Service registration methods
    @Override
    public Service registerService(Service registration) {
        // Check if this service has already registered with an appId
        Optional<Service> existingService = Optional.empty();
        
        if (registration.getAppId() != null) {
            existingService = getServiceByAppId(registration.getAppId());
        }
        
        // Update or create service
        if (existingService.isPresent()) {
            return updateService(existingService.get().getId(), registration);
        } else {
            // Generate a UUID if appId is not provided
            if (registration.getAppId() == null) {
                registration.setAppId(UUID.randomUUID().toString());
            }
            return createService(registration);
        }
    }

    // Health check methods
    @Override
    public List<Service> getServicesForHealthCheck(int maxAgeSeconds) {
        LocalDateTime cutoffTime = LocalDateTime.now().minusSeconds(maxAgeSeconds);
        
        return services.values().stream()
                .filter(service -> {
                    // Skip services that don't need checking
                    if (service.getStatus() == ServiceStatus.DOWN && 
                        service.getLastSeen() != null && 
                        service.getLastSeen().isBefore(cutoffTime)) {
                        return false;
                    }
                    
                    // Check based on interval if specified
                    if (service.getHealthCheckInterval() != null && service.getLastSeen() != null) {
                        LocalDateTime nextCheckTime = service.getLastSeen()
                                .plusSeconds(service.getHealthCheckInterval());
                        return LocalDateTime.now().isAfter(nextCheckTime);
                    }
                    
                    // Default: check services that haven't been checked recently
                    return service.getLastSeen() == null || service.getLastSeen().isBefore(cutoffTime);
                })
                .collect(Collectors.toList());
    }

    // Metrics methods
    @Override
    public List<Metric> getMetricsForService(Long serviceId, int limit) {
        List<Metric> serviceMetrics = metrics.getOrDefault(serviceId, new ArrayList<>());
        
        // Return the most recent metrics first
        return serviceMetrics.stream()
                .sorted(Comparator.comparing(Metric::getTimestamp).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    @Override
    public Metric createMetric(Metric metric) {
        metric.setId(currentMetricId++);
        if (metric.getTimestamp() == null) {
            metric.setTimestamp(LocalDateTime.now());
        }
        
        List<Metric> serviceMetrics = metrics.computeIfAbsent(metric.getServiceId(), k -> new ArrayList<>());
        serviceMetrics.add(metric);
        
        return metric;
    }

    // Logs methods
    @Override
    public List<Log> getLogsForService(Long serviceId, int limit) {
        List<Log> serviceLogs = logs.getOrDefault(serviceId, new ArrayList<>());
        
        // Return the most recent logs first
        return serviceLogs.stream()
                .sorted(Comparator.comparing(Log::getTimestamp).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    @Override
    public Log createLog(Log log) {
        log.setId(currentLogId++);
        if (log.getTimestamp() == null) {
            log.setTimestamp(LocalDateTime.now());
        }
        
        List<Log> serviceLogs = logs.computeIfAbsent(log.getServiceId(), k -> new ArrayList<>());
        serviceLogs.add(log);
        
        return log;
    }

    // Configuration methods
    @Override
    public List<ConfigProperty> getConfigPropertiesForService(Long serviceId) {
        return configProperties.getOrDefault(serviceId, new ArrayList<>());
    }

    @Override
    public Optional<ConfigProperty> getConfigProperty(Long id) {
        return configProperties.values().stream()
                .flatMap(List::stream)
                .filter(property -> property.getId().equals(id))
                .findFirst();
    }

    @Override
    public ConfigProperty createConfigProperty(ConfigProperty property) {
        property.setId(currentConfigPropertyId++);
        if (property.getLastUpdated() == null) {
            property.setLastUpdated(LocalDateTime.now());
        }
        
        List<ConfigProperty> serviceProperties = configProperties.computeIfAbsent(
                property.getServiceId(), k -> new ArrayList<>());
        serviceProperties.add(property);
        
        return property;
    }

    @Override
    public ConfigProperty updateConfigProperty(Long id, ConfigProperty updatedProperty) {
        // Find the property to update
        for (List<ConfigProperty> properties : configProperties.values()) {
            for (int i = 0; i < properties.size(); i++) {
                ConfigProperty property = properties.get(i);
                if (property.getId().equals(id)) {
                    updatedProperty.setId(id);
                    updatedProperty.setLastUpdated(LocalDateTime.now());
                    properties.set(i, updatedProperty);
                    return updatedProperty;
                }
            }
        }
        
        throw new IllegalArgumentException("Config property not found with id: " + id);
    }

    @Override
    public void deleteConfigProperty(Long id) {
        configProperties.values().forEach(properties -> {
            properties.removeIf(property -> property.getId().equals(id));
        });
    }
}