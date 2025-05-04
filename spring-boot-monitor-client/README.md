# Spring Boot Monitoring Client

This library provides automatic integration between Spring Boot applications and the Spring Boot Monitoring Dashboard.

## Features

- **Zero-Configuration Integration**: Add the dependency and enable monitoring with one property
- **Automatic Service Registration**: Applications automatically register with the dashboard on startup
- **Health Monitoring**: Dashboard periodically checks application health via Spring Boot Actuator
- **Metrics Collection**: Exposes memory, CPU, and error metrics from your application
- **Log Streaming**: Supports real-time log streaming to the dashboard
- **Configuration Management**: View and update application configuration through the dashboard
- **Multi-Version Support**: Compatible with Spring Boot 2.7.x through 3.2.x

## Installation

### Gradle

Add the following to your `build.gradle`:

```groovy
dependencies {
    implementation 'com.example:spring-boot-monitor-client:1.0.0'
    
    // Required Spring Boot dependencies
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
}
```

### Maven

If you prefer Maven, add to your `pom.xml`:

```xml
<dependency>
    <groupId>com.example</groupId>
    <artifactId>spring-boot-monitor-client</artifactId>
    <version>1.0.0</version>
</dependency>
```

## Configuration

Add the following properties to your `application.properties` or `application.yml`:

```properties
# Enable Boot Monitoring (required)
monitor.enabled=true

# Monitor Dashboard URL (required)
# For Kubernetes, this would be the service name
monitor.dashboard-url=http://dashboard-service:3000

# Application ID (optional, will be generated if not provided)
# Use a consistent ID for applications that should maintain history across restarts
monitor.app-id=my-application-id

# Registration settings
monitor.auto-register=true
monitor.heartbeat-interval-ms=30000
```

## Spring Boot Actuator Configuration

For the monitoring dashboard to collect metrics and logs, enable the appropriate Actuator endpoints:

```properties
# Expose all actuator endpoints
management.endpoints.web.exposure.include=*

# Show detailed health information
management.endpoint.health.show-details=always

# Configure the base path for actuator endpoints (default: /actuator)
management.endpoints.web.base-path=/actuator
```

## Application Information

To display useful information on the dashboard, configure the `info` endpoint:

```properties
# Application Info (used for dashboard)
info.app.name=${spring.application.name}
info.app.version=1.0.0
info.app.description=Your Application Description
info.app.contact.email=admin@example.com
```

## How It Works

1. When your application starts, the `SpringBootRegistrar` automatically registers with the monitoring dashboard
2. The dashboard server periodically performs health checks on your application
3. Metrics are collected at regular intervals (configurable)
4. Logs are streamed in real-time through a WebSocket connection
5. Configuration changes made through the dashboard are applied to your application

## Building From Source

To build the client from source:

```bash
./gradlew clean build
```

To build for a specific Spring Boot version:

```bash
./gradlew springBoot27 build  # For Spring Boot 2.7.x
./gradlew springBoot30 build  # For Spring Boot 3.0.x
./gradlew springBoot31 build  # For Spring Boot 3.1.x
./gradlew springBoot32 build  # For Spring Boot 3.2.x (default)
```

## Example Application

See the `samples` directory for example applications using this client.

## Troubleshooting

### Registration Issues

If your application fails to register with the dashboard:

1. Check that the dashboard service is running and accessible
2. Verify the correct dashboard URL in your application properties
3. Ensure network connectivity between your application and the dashboard
4. Check the application logs for any registration errors

### Metrics Collection Issues

If metrics aren't showing up on the dashboard:

1. Verify that the actuator endpoints are properly exposed
2. Check that the application has the necessary permissions to gather system metrics
3. Look for any errors in the application logs related to metrics collection

## License

This project is licensed under the MIT License - see the LICENSE file for details.