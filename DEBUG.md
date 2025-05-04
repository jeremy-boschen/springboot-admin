# Debugging Guide for Obserra

This guide provides instructions for running all components of the Obserra project together for debugging purposes. It includes both Docker-based and local development approaches.

## Project Components

The Obserra project consists of three main components:

1. **obserra-dashboard**: A Node.js/React dashboard application
2. **obserra-spring-boot-starter**: A Spring Boot client library
3. **obserra-samples/demo-app-gradle**: A sample Spring Boot application that uses the client library

## Approach 1: Docker-based Development

This approach uses Docker to run all components, which ensures a consistent environment but may make debugging more challenging.

### Prerequisites

- Docker and Docker Compose installed
- Git repository cloned

### Steps

1. **Build and run all components using Docker Compose**:

   ```bash
   docker-compose -f debug-docker-compose.yml up --build
   ```

2. **Access the components**:
   - Dashboard: http://localhost:3000
   - Sample App: http://localhost:8080

3. **View logs**:

   ```bash
   # View dashboard logs
   docker logs -f obserra-dashboard

   # View sample app logs
   docker logs -f obserra-demo-app
   ```

## Approach 2: Hybrid Development (Recommended for Debugging)

This approach runs the dashboard in Docker and the Spring Boot components locally, which makes debugging the Java code easier.

### Prerequisites

- Docker installed
- Node.js and npm installed
- JDK 17 installed
- Git repository cloned

### Steps

1. **Run the dashboard using Docker**:

   ```bash
   cd obserra-dashboard
   docker build -t obserra-dashboard .
   docker run -p 3000:3000 -e NODE_ENV=development obserra-dashboard
   ```

   Alternatively, run it locally:

   ```bash
   cd obserra-dashboard
   npm install
   npm run dev
   ```

2. **Build the Spring Boot starter**:

   ```bash
   ./gradlew :obserra-spring-boot-starter:build
   ```

3. **Run the sample app with debugging enabled**:

   ```bash
   ./gradlew :obserra-samples:demo-app-gradle:bootRun --debug-jvm
   ```

4. **Connect your IDE debugger** to the sample app (typically on port 5005).

5. **Access the components**:
   - Dashboard: http://localhost:3000
   - Sample App: http://localhost:8080

## Approach 3: Fully Local Development

This approach runs all components locally, which provides the most flexibility for debugging but requires setting up all dependencies.

### Prerequisites

- Node.js and npm installed
- JDK 17 installed
- Git repository cloned

### Steps

1. **Run the dashboard locally**:

   ```bash
   cd obserra-dashboard
   npm install
   npm run dev
   ```

2. **Build the Spring Boot starter**:

   ```bash
   ./gradlew :obserra-spring-boot-starter:build
   ```

3. **Run the sample app with debugging enabled**:

   ```bash
   ./gradlew :obserra-samples:demo-app-gradle:bootRun --debug-jvm
   ```

4. **Connect your IDE debugger** to both components:
   - For the Node.js dashboard, use your IDE's Node.js debugging capabilities
   - For the Spring Boot app, connect to port 5005

5. **Access the components**:
   - Dashboard: http://localhost:3000
   - Sample App: http://localhost:8080

## Testing the Integration

1. Open the dashboard at http://localhost:3000
2. Verify that the sample app appears in the dashboard
3. Test the sample app endpoints:
   - http://localhost:8080/hello
   - http://localhost:8080/random-error
   - http://localhost:8080/memory-test
   - http://localhost:8080/cpu-test
4. Observe the metrics and logs in the dashboard

## Troubleshooting

### Dashboard Can't Connect to Sample App

- Ensure the sample app is running and the `monitor.dashboard-url` property is set correctly
- Check that the network allows connections between the components
- If using Docker, ensure the containers are on the same network

### Sample App Doesn't Appear in Dashboard

- Check the sample app logs for registration errors
- Verify that the `monitor.enabled` property is set to `true`
- Ensure the dashboard URL is correct in the sample app configuration

### IDE Debugger Won't Connect

- Verify that the debug port is correct (typically 5005 for Java)
- Ensure no firewall is blocking the connection
- Check that the application was started with debugging enabled