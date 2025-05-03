# Spring Boot Kubernetes Monitor

A comprehensive monitoring and troubleshooting platform for Spring Boot applications deployed in Kubernetes environments. This application automatically discovers Spring Boot services, monitors their health and performance, and provides a user-friendly dashboard for rapid diagnostics and debugging.

## Architecture Overview

### Client-Server Architecture
The application follows a client-server architecture with the following components:

#### Frontend (Client)
- Built with React and modern UI libraries (shadcn, tailwind CSS)
- Responsive design for mobile, tablet, and desktop views
- React Query for efficient data fetching and caching
- Support for both light and dark themes
- Deep linking support for shareable URLs to specific services and sections

#### Backend (Server)
- Node.js Express server
- Kubernetes client integration for service discovery
- Spring Boot Actuator client for metrics collection
- WebSocket support for real-time log streaming
- In-memory storage for development (can be extended to persistent databases)

#### Key Technologies
- React for frontend UI components
- Node.js and Express for backend API
- Kubernetes API for service discovery
- Spring Boot Actuator API for metrics and logs
- WebSockets for real-time communication
- Tailwind CSS for styling

### Data Flow
1. **Service Discovery**: The application periodically scans Kubernetes clusters for Spring Boot services
2. **Metrics Collection**: For each service, the app collects metrics and logs via the Spring Boot Actuator endpoints
3. **Data Storage**: Service information, metrics, and logs are stored (in-memory by default)
4. **Dashboard Presentation**: The frontend fetches and displays this data as interactive dashboards
5. **Real-time Updates**: WebSockets provide real-time log streaming for monitoring

### Key Features
- Automatic service discovery in Kubernetes clusters
- Real-time monitoring of service health, metrics, and logs
- Configurable log levels for runtime debugging
- Configuration property management
- Restart capability for Kubernetes deployments
- Full-screen log viewing with filtering and search
- Shareable deep links to specific services and sections

## Project Structure

```
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions
│   │   ├── pages/        # Page components
│   │   └── types/        # TypeScript type definitions
│
├── server/               # Node.js backend
│   ├── actuator/         # Spring Boot Actuator client
│   ├── k8s/              # Kubernetes integration
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data storage implementation
│   └── config.ts         # Configuration management
│
└── shared/               # Shared TypeScript types
    └── schema.ts         # Database schema definitions
```

## Configuration

The application can be configured through the `config.yaml` file, which allows you to customize:

- Service discovery interval
- Metrics collection frequency
- Logging configuration
- Kubernetes cluster settings
- Default UI settings and theme

## Deployment

For deployment in your Kubernetes environment, you'll need to:

1. Ensure the app has the necessary permissions to interact with the K8s API
2. Set the `useRealCluster` flag to `true` in `server/k8s/client.ts`
3. Optionally, adjust the service discovery interval and metrics collection frequency in `config.yaml`
4. Deploy using the provided Dockerfile or Kubernetes manifests

## Development

To run the application locally:

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Access the application at: `http://localhost:3000`

For development, the application uses mock data by default. To connect to a real Kubernetes cluster, 
modify the configuration as described in the deployment section.