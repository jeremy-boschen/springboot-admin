# Obserra Spring Boot Starter

This module provides automatic service registration for Spring Boot applications with the Obserra monitoring frontend.

## Service Registration Process

The Obserra Spring Boot Starter automatically registers your Spring Boot application with the Obserra monitoring frontend, enabling real-time monitoring, metrics collection, and health checks.

### How Service Registration Works

1. **Initialization**: When your Spring Boot application starts, the `SpringBootRegistrar` component is initialized.

2. **Auto-Registration**: Once the application is ready (triggered by the `ApplicationReadyEvent`), the registrar checks if monitoring is enabled and auto-registration is turned on.

3. **Building Registration Data**: The registrar collects information about your application, including:
   - Application name (from `spring.application.name` property)
   - Application ID (configured or auto-generated UUID)
   - Host address and port
   - Actuator endpoints URL
   - Version information
   - Context path

4. **Registration Request**: The collected information is packaged into a `ServiceRegistrationRequest` object and sent to the Obserra backend via the `MonitorService`.

5. **Response Handling**: Upon successful registration, the backend returns a `ServiceRegistrationResponse` containing the registered application ID, which is stored for future communications.

6. **Heartbeat Mechanism**: After registration, the application sends periodic heartbeats to the backend to indicate it's still running. The default interval is 30 seconds.

## Configuration

Configure the Obserra monitoring in your `application.properties` or `application.yml` file:

```yaml
# Enable/disable Obserra monitoring
obserra:
  enabled: true

  # Registration server URL (default: localhost:3000)
  registration-server: http://localhost:5000

  # Optional: Specify a custom application ID
  # If not provided, a random UUID will be generated
  app-id: my-custom-app-id

  # Optional: Specify application name and metadata
  app-name: my-application
  app-description: My application description
  app-version: 1.0.0

  # Enable/disable auto-registration (default: true)
  auto-register: true

  # Heartbeat interval (default: 30s)
  check-interval: 15s
```

## Manual Registration

If auto-registration is disabled, you can manually register your application using the `MonitorService`:

```java
@Autowired
private MonitorService monitorService;

public void registerManually() {
    ServiceRegistration.Request request = new ServiceRegistration.Request();
    request.setName("my-application");
    request.setAppId("custom-app-id");
    // Set other properties as needed

    monitorService.registerWithDashboard(request);
}
```

## Requirements

- Spring Boot 2.x or higher
- Spring Boot Actuator enabled
- Network connectivity to the Obserra backend

## Troubleshooting

If registration fails, check the following:

1. Ensure the Obserra backend is running and accessible
2. Verify that the `obserra.registration-server` property is correctly set
3. Make sure Spring Boot Actuator is enabled and endpoints are accessible
4. Check network connectivity between your application and the backend
