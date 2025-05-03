# Spring Boot Monitoring Client

This package provides automatic integration between Spring Boot applications and the Spring Boot Monitoring Dashboard.

## Features

- **Automatic Registration**: Spring Boot applications automatically register with the dashboard on startup
- **Health Monitoring**: Dashboard periodically checks application health via Spring Boot's Actuator
- **Metrics Collection**: Collects memory, CPU, and error metrics from your application
- **Log Streaming**: Real-time log streaming from applications to the dashboard
- **Configuration Management**: View and update application configuration through the dashboard
- **Minimal Dependencies**: Uses only standard Spring Boot libraries

## Compatibility

This library supports the following Spring Boot versions:
- Spring Boot 2.7.x
- Spring Boot 3.0.x
- Spring Boot 3.1.x
- Spring Boot 3.2.x (default)

## Installation

### Maven

Add the following dependency to your pom.xml:

```xml
<dependency>
    <groupId>com.example</groupId>
    <artifactId>boot-monitoring-client</artifactId>
    <version>1.0.0</version>
</dependency>
```

### Gradle

Add the following dependency to your build.gradle:

```groovy
implementation 'com.example:boot-monitoring-client:1.0.0'
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

For the monitoring dashboard to collect metrics and logs, you need to enable the appropriate Actuator endpoints:

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

## Security Considerations

- This library communicates with the dashboard server over HTTP/HTTPS
- No authentication is built in as it's designed for use in secure cluster environments
- For production use, consider enabling TLS and implementing appropriate network policies

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.