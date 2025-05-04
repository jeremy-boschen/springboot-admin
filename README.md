# Spring Boot Monitoring System

A comprehensive monitoring solution for Spring Boot applications, designed to simplify complex service management and provide actionable insights for development and operations teams.

## Project Structure

This repository contains two main components:

1. **[spring-boot-monitor-app](./spring-boot-monitor-app)**: The Node.js/React dashboard application
   - Centralized monitoring dashboard for visualizing services
   - Real-time metrics and log streaming
   - REST API for service registration
   - WebSocket support for live updates

2. **[spring-boot-monitor-client](./spring-boot-monitor-client)**: The Spring Boot client library
   - Auto-registration with the dashboard
   - Spring Boot Actuator integration
   - Zero-configuration for simple setup
   - Custom metrics support

## Key Features

- **Comprehensive Dashboard**: Visualize all of your Spring Boot services in a centralized, intuitive dashboard
- **Real-time Monitoring**: Track service health, metrics, and logs in real-time
- **Automatic Service Discovery**: Services auto-register with the dashboard for zero-configuration monitoring
- **Performance Metrics**: View memory usage, CPU utilization, and other key performance indicators
- **Log Streaming**: Stream logs in real-time from your applications directly to the dashboard
- **Configuration Management**: View and modify application configuration properties
- **Dark Mode Support**: Built-in dark mode for reduced eye strain during night shifts

## Getting Started

### Dashboard Application

Follow the instructions in the [spring-boot-monitor-app README](./spring-boot-monitor-app/README.md) to set up and run the dashboard application.

### Client Library

Follow the instructions in the [spring-boot-monitor-client README](./spring-boot-monitor-client/README.md) to integrate the client library with your Spring Boot applications.

## Architecture

The monitoring solution follows a simplified architecture:

1. **Dashboard Application**: A Node.js/React application serving as the centralized monitoring dashboard and registration endpoint.
2. **Client Library**: A Spring Boot auto-configuration JAR that applications include to register themselves with the dashboard.
3. **Service Registration**: Spring Boot applications automatically register with the dashboard on startup.
4. **Health Checks**: The dashboard periodically checks service health and collects metrics.
5. **Log Streaming**: Real-time log streaming using WebSockets for instant feedback.

## Deployment

Both components can be deployed independently:

- The dashboard application can be containerized and deployed to Kubernetes, Docker, or any cloud provider.
- The client library is a standard Java library distributed via Maven or Gradle and included in Spring Boot applications.

## License

This project is licensed under the MIT License.