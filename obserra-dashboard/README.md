# Obserra Dashboard

This is the dashboard UI for the Obserra monitoring system.

## Running with Java Backend

The dashboard UI can now be run with the Java backend instead of the Node.js backend. Follow these steps:

### 1. Start the Java Backend

First, make sure the Java backend is running:

```bash
# Navigate to the obserra-backend directory
cd ../obserra-backend

# Run the Spring Boot application
./gradlew bootRun
```

This will start the Java backend on port 5000.

### 2. Start the Dashboard UI

In a separate terminal, start the dashboard UI:

```bash
# Navigate to the obserra-dashboard directory
cd ../obserra-dashboard

# Install dependencies (if not already done)
npm install

# Run the dashboard UI with Java backend
npm run dev:java
```

This will start the dashboard UI on port 3000 and proxy all API requests to the Java backend on port 5000.

### 3. Access the Dashboard

Open your browser and navigate to:

```
http://localhost:3000
```

## Development

### Running with Node.js Backend (Original Mode)

If you want to run the dashboard with the original Node.js backend:

```bash
npm run dev
```

This will start both the UI and the Node.js backend on port 5000.

### Building for Production

To build the dashboard for production:

```bash
npm run build
```

This will create a production build in the `dist` directory.

### Running in Production Mode

To run the dashboard in production mode:

```bash
npm run start
```

This will serve the production build from the `dist` directory.