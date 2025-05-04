# Spring Boot Monitor Client

A Spring Boot auto-configuration library that simplifies adding monitoring capabilities to your Spring Boot applications. This library automatically registers your Spring Boot application with the monitoring dashboard, providing detailed metrics, logs, and health status information.

## Features

- **Zero configuration setup**: Works out of the box with sensible defaults
- **Auto-registration**: Automatically registers with the monitoring dashboard on startup
- **Actuator integration**: Leverages Spring Boot Actuator for health, metrics, and environment information
- **Custom metrics**: Send custom application metrics to the dashboard
- **Real-time log streaming**: View application logs in real-time on the dashboard
- **Service health monitoring**: Automatically monitor service health status

## Requirements

- Java 17 or later
- Spring Boot 3.0 or later
- Spring Boot Actuator (included as a dependency)

## Getting Started

### 1. Add the Dependency

#### Maven
```xml
<dependency>
  <groupId>com.example</groupId>
  <artifactId>spring-boot-monitor-client</artifactId>
  <version>0.1.0-SNAPSHOT</version>
</dependency>
```

#### Gradle
```groovy
implementation 'com.example:spring-boot-monitor-client:0.1.0-SNAPSHOT'
```

### 2. Configure the Monitor

Add the following properties to your `application.properties` or `application.yml` file:

```properties
# Enable monitoring (required)
monitor.enabled=true

# URL of the monitoring dashboard (required)
monitor.dashboard-url=http://monitoring-dashboard:3000

# Application ID (optional, will be generated if not provided)
monitor.app-id=my-unique-application-id

# Registration settings (optional)
monitor.auto-register=true
monitor.heartbeat-interval-ms=30000
```

### 3. Enable Actuator Endpoints

For best results, enable all Spring Boot Actuator endpoints:

```properties
# Spring Boot Actuator Configuration
management.endpoints.web.exposure.include=*
management.endpoint.health.show-details=always
management.endpoints.web.base-path=/actuator

# Application Info (used for dashboard)
info.app.name=${spring.application.name}
info.app.version=1.0.0
info.app.description=Your application description
info.app.contact.email=admin@example.com
```

## Advanced Usage

### Sending Custom Metrics

You can send custom metrics to the dashboard using the `MonitorService`:

```java
@Service
public class MyService {
    
    private final MonitorService monitorService;
    
    @Autowired
    public MyService(MonitorService monitorService) {
        this.monitorService = monitorService;
    }
    
    public void processOrders() {
        // Process orders...
        
        // Send custom metrics
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("ordersProcessed", 42);
        metrics.put("averageProcessingTimeMs", 156);
        
        monitorService.sendCustomMetrics(metrics);
    }
}
```

### Manual Registration

If auto-registration is disabled, you can manually register with the dashboard:

```java
@Service
public class StartupService {
    
    private final MonitorService monitorService;
    
    @Autowired
    public StartupService(MonitorService monitorService) {
        this.monitorService = monitorService;
    }
    
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        Map<String, Object> appInfo = new HashMap<>();
        appInfo.put("name", "My Custom App");
        appInfo.put("version", "1.2.3");
        
        monitorService.registerWithDashboard(appInfo);
    }
}
```

## Sample Application

The library includes a sample application in the `samples/demo-app` directory that demonstrates how to use the monitor client. You can run it with:

```bash
./gradlew :samples:demo-app:bootRun
```

The sample application includes endpoints that generate various metrics and logs to demonstrate the monitoring capabilities.

## Building from Source

To build the library from source:

```bash
./gradlew build
```

To install to your local Maven repository:

```bash
./gradlew publishToMavenLocal
```

## License

This project is licensed under the MIT License.