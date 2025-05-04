# Spring Boot Monitor App

A comprehensive monitoring platform for Spring Boot applications, designed to simplify complex service management and provide actionable insights for development and operations teams.

## Features

- **Comprehensive Dashboard**: Visualize all of your Spring Boot services in a centralized, intuitive dashboard
- **Real-time Monitoring**: Track service health, metrics, and logs in real-time
- **Automatic Service Discovery**: Services auto-register with the dashboard for zero-configuration monitoring
- **Performance Metrics**: View memory usage, CPU utilization, and other key performance indicators
- **Log Streaming**: Stream logs in real-time from your applications directly to the dashboard
- **Configuration Management**: View and modify application configuration properties
- **Dark Mode Support**: Built-in dark mode for reduced eye strain during night shifts

## Architecture

The monitoring solution is made up of two main components:

1. **Spring Boot Monitor App**: A Node.js/React application that serves as the dashboard and central server with registration endpoints (this repository)
2. **Spring Boot Monitor Client**: A Spring Boot auto-configuration JAR that Spring Boot applications can include to register themselves with the dashboard

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- For development: Git, TypeScript

### Installation

#### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/obserra-dashboard.git
cd obserra-dashboard

# Install dependencies
npm install

# Start the development server
npm run dev
```

#### Docker

```bash
# Build and run with Docker
docker build -t obserra-dashboard .
docker run -p 3000:3000 obserra-dashboard
```

#### Docker Compose

```bash
# Start the application using Docker Compose
docker-compose up -d
```

### Kubernetes Deployment

The `k8s` directory contains Kubernetes deployment manifests:

```bash
# Apply the Kubernetes manifests
kubectl apply -f k8s/
```

## Integrating Spring Boot Applications

To integrate your Spring Boot applications with the dashboard, add the Spring Boot Monitor Client to your project:

```xml
<!-- Maven -->
<dependency>
  <groupId>com.example</groupId>
  <artifactId>obserra-spring-boot-starter</artifactId>
  <version>0.1.0-SNAPSHOT</version>
</dependency>
```

```groovy
// Gradle
implementation 'com.example:obserra-spring-boot-starter:0.1.0-SNAPSHOT'
```

Then add the following configuration to your `application.properties` or `application.yml`:

```properties
# Enable monitoring
monitor.enabled=true

# URL of the monitoring dashboard
monitor.dashboard-url=http://monitor-app:3000

# Optional: Application ID (will be generated if not provided)
monitor.app-id=my-unique-application-id
```

## Development

### Project Structure

- `client/`: React frontend application
- `server/`: Node.js backend application
- `shared/`: Shared TypeScript definitions and schemas
- `k8s/`: Kubernetes deployment manifests

### Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm run lint`: Run the linter
- `npm start`: Start the production server

## License

This project is licensed under the MIT License.