# Obserra – Spring Boot Monitoring System

Obserra is a comprehensive monitoring solution for Spring Boot applications, designed to simplify service management and provide actionable insights for development and operations teams.

## Project Structure

This repository contains two main components:

1. **[obserra-dashboard](obserra-frontend)**: The Node.js/React dashboard application
   - Centralized UI for visualizing service health and activity
   - Real-time metrics and log streaming
   - REST API for manual service registration
   - WebSocket support for live updates

2. **[obserra-spring-boot-starter](./obserra-spring-boot-starter)**: The Spring Boot client library
   - Auto-registration with the dashboard
   - Spring Boot Actuator integration
   - Zero-configuration setup via Spring Boot autoconfig
   - Custom metrics and health endpoints support

## Key Features

- **Unified Dashboard**: View all your Spring Boot services in one place
- **Real-time Monitoring**: Live metrics, logs, and health data
- **Flexible Service Discovery**: Supports both manual registration and Kubernetes-based discovery
- **Performance Metrics**: Monitor JVM metrics, memory, CPU, and more
- **Log Streaming**: Stream logs to the dashboard over WebSockets
- **Configuration Visibility**: Inspect active configuration values in each service
- **Dark Mode Support**: Modern UI with built-in dark mode

## Getting Started

### Dashboard Application

Refer to the [obserra-dashboard README](obserra-frontend/README.md) for setup and run instructions.

### Client Library

Refer to the [obserra-spring-boot-starter README](./obserra-spring-boot-starter/README.md) for integration details.

### Debugging

For running all components together for debugging purposes, refer to the [Debugging Guide](./DEBUG.md). 
We provide scripts for both Windows (`debug.bat`) and Linux/macOS (`debug.sh`) to simplify the debugging process.

## Architecture

Obserra follows a modular architecture:

1. **Dashboard Application**: Node.js/React frontend and API layer for observability and control
2. **Client Library**: Spring Boot autoconfig JAR for seamless integration with any service
3. **Service Registration**: Clients register themselves with the dashboard on startup
4. **Health Checks**: Dashboard polls health endpoints or reacts to status changes
5. **Log Streaming**: Real-time logs via WebSocket push

## Deployment

- The dashboard can be deployed via Docker, Kubernetes, or any cloud runtime
- The client library is distributed via Maven/Gradle and imported in any Spring Boot project

## License

This project is licensed under the MIT License.
