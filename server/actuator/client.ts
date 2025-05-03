import axios from 'axios';
import config from '../config';

// Mock data for development
const MOCK_HEALTH_DATA = {
  status: 'UP',
  components: {
    diskSpace: { status: 'UP' },
    db: { status: 'UP' },
    ping: { status: 'UP' }
  }
};

const MOCK_INFO_DATA = {
  build: {
    version: '2.5.1',
    artifact: 'spring-boot-app',
    name: 'Spring Boot Application',
    time: '2023-05-03T10:15:30Z',
    group: 'com.example'
  },
  java: {
    version: '17.0.2',
    vendor: 'Oracle Corporation'
  }
};

const MOCK_METRICS_DATA = {
  names: [
    'jvm.memory.used',
    'jvm.memory.max',
    'process.cpu.usage',
    'http.server.requests'
  ]
};

const MOCK_METRICS = {
  memoryUsed: {
    name: 'jvm.memory.used',
    measurements: [
      { statistic: 'VALUE', value: 332 * 1024 * 1024 } // 332MB in bytes
    ]
  },
  memoryMax: {
    name: 'jvm.memory.max',
    measurements: [
      { statistic: 'VALUE', value: 1024 * 1024 * 1024 } // 1GB in bytes
    ]
  },
  cpuUsage: {
    name: 'process.cpu.usage',
    measurements: [
      { statistic: 'VALUE', value: 0.35 } // 35% usage
    ]
  },
  httpRequests: {
    name: 'http.server.requests',
    availableTags: [
      {
        tag: 'status',
        values: ['200', '404', '500']
      }
    ]
  }
};

const MOCK_LOGS = [
  // ERROR level examples
  '2025-05-03 09:15:21.567 ERROR [http-nio-8080-exec-3] Failed to process request: /api/invalid - 404 Not Found',
  '2025-05-03 09:15:22.890 ERROR [http-nio-8080-exec-3] java.lang.NullPointerException: Cannot invoke method on null object',
  '2025-05-03 09:17:30.256 ERROR [http-nio-8080-exec-5] Connection refused: connect to database',
  '2025-05-03 09:18:45.123 ERROR [http-nio-8080-exec-6] Failed to authenticate user: Invalid credentials',
  '2025-05-03 09:20:15.789 ERROR [scheduling-1] Job execution failed: TimeoutException after 30000ms',
  
  // WARN level examples
  '2025-05-03 09:25:15.234 WARN  [http-nio-8080-exec-2] Slow query detected, took 1500ms',
  '2025-05-03 09:26:33.567 WARN  [http-nio-8080-exec-7] Deprecated API endpoint called: /api/v1/legacy',
  '2025-05-03 09:28:42.123 WARN  [pool-1-thread-3] Connection pool is 80% utilized',
  '2025-05-03 09:35:56.789 WARN  [background-prune-1] Cache eviction running for more than 5 seconds',
  '2025-05-03 09:40:17.345 WARN  [main] Application is running with default security credentials',
  
  // INFO level examples
  '2025-05-03 10:15:32.789 INFO  [main] Database connection established successfully',
  '2025-05-03 10:15:33.012 INFO  [main] Loading application context with 25 beans',
  '2025-05-03 10:15:34.345 INFO  [main] Application started successfully on port 8080',
  '2025-05-03 10:16:01.678 INFO  [http-nio-8080-exec-1] Processing request: GET /api/products',
  '2025-05-03 10:16:02.901 INFO  [http-nio-8080-exec-1] Request processed successfully in 223ms',
  '2025-05-03 10:17:45.123 INFO  [http-nio-8080-exec-4] Processing request: GET /api/orders?userId=12345',
  '2025-05-03 10:17:47.789 INFO  [http-nio-8080-exec-4] Request processed successfully, returned 15 orders',
  '2025-05-03 10:20:33.456 INFO  [scheduler-1] Starting scheduled task: database-cleanup',
  '2025-05-03 10:25:01.890 INFO  [http-nio-8080-exec-8] User admin logged in successfully',
  '2025-05-03 10:30:15.123 INFO  [messaging-1] Received message from queue: order-processing',
  
  // DEBUG level examples
  '2025-05-03 10:35:46.456 DEBUG [http-nio-8080-exec-4] Query execution time: 34ms for SELECT * FROM orders',
  '2025-05-03 10:36:12.789 DEBUG [http-nio-8080-exec-5] Request headers: {Content-Type=application/json, Authorization=Bearer ...}',
  '2025-05-03 10:37:29.123 DEBUG [http-nio-8080-exec-9] Parsing JSON payload: {"orderId":"ORD-12345","items":[...]}',
  '2025-05-03 10:38:45.567 DEBUG [worker-3] Processing item 5 of 20 in batch',
  '2025-05-03 10:39:56.234 DEBUG [cache-service] Cache hit for key: product-catalog',
  '2025-05-03 10:40:17.890 DEBUG [transaction-manager] Beginning transaction: TX-987654',
  '2025-05-03 10:41:23.456 DEBUG [transaction-manager] Committing transaction: TX-987654',
  '2025-05-03 10:42:45.789 DEBUG [connection-pool] Acquiring connection from pool (active: 5, idle: 10)',
  '2025-05-03 10:43:12.123 DEBUG [security-filter] Authenticating request for path: /api/admin/settings',
  '2025-05-03 10:44:30.567 DEBUG [template-engine] Rendering template: product-details.html',
  
  // TRACE level examples
  '2025-05-03 10:45:47.234 TRACE [http-nio-8080-exec-10] Entering method: ProductController.getProductDetails',
  '2025-05-03 10:46:05.789 TRACE [http-nio-8080-exec-10] Parameter values: {id=12345, includeMetadata=true}',
  '2025-05-03 10:46:15.123 TRACE [http-nio-8080-exec-10] SQL being executed: SELECT * FROM products WHERE id = ?',
  '2025-05-03 10:46:28.456 TRACE [http-nio-8080-exec-10] Result set has 1 row',
  '2025-05-03 10:46:35.890 TRACE [http-nio-8080-exec-10] Exiting method: ProductController.getProductDetails',
  '2025-05-03 10:47:42.234 TRACE [data-access] Connection obtained for query execution',
  '2025-05-03 10:48:15.678 TRACE [security-context] Setting authentication token in security context',
  '2025-05-03 10:49:33.123 TRACE [web-filter-chain] Filter chain proceeding: 5 of 8 filters completed',
  '2025-05-03 10:50:47.789 TRACE [http-client] Sending HTTP request: GET https://api.example.com/data',
  '2025-05-03 10:51:10.234 TRACE [http-client] Received response: 200 OK, content length: 1256 bytes'
];

/**
 * Spring Boot Actuator Client
 * 
 * This class provides an interface to the Spring Boot Actuator API to gather health,
 * metrics, logs, and configuration information from Spring Boot applications.
 * 
 * The client supports both real data fetching from live Spring Boot applications
 * and mock data for development or testing environments. It fetches data from
 * standard Actuator endpoints like /health, /info, /metrics, and /logfile.
 * 
 * Key capabilities:
 * - Health status checks to determine if services are UP, DOWN, or in WARNING state
 * - Version and build information retrieval
 * - Metrics collection (memory usage, CPU usage, request counts, etc.)
 * - Log file access and parsing
 * 
 * Endpoint paths and connection settings are configured via the application's
 * config file, supporting customization of Actuator paths and timeouts.
 */
export class ActuatorClient {
  private baseUrl: string;
  private useMockData: boolean = true;
  private actuatorBasePath: string;
  private endpoints: {
    health: string;
    info: string;
    metrics: string;
    logfile: string;
  };

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Use mock data based on the Kubernetes config
    this.useMockData = !config.kubernetes.inCluster;
    
    // Use endpoints from config
    this.actuatorBasePath = config.actuator.basePath;
    this.endpoints = config.actuator.endpoints;
  }

  /**
   * Builds the full actuator endpoint URL
   * @param endpoint The endpoint path from configuration
   * @returns Full URL to the actuator endpoint
   */
  private getEndpointUrl(endpoint: string): string {
    return `${this.baseUrl}${this.actuatorBasePath}${endpoint}`;
  }
  
  /**
   * Get health status information from the Spring Boot application
   * 
   * Fetches data from the /health endpoint to determine if the service is
   * running properly. The health endpoint typically returns an overall status
   * (UP, DOWN, or WARNING) and component-specific health checks.
   * 
   * @returns Health status information including overall status and component details
   */
  async getHealth() {
    if (this.useMockData) {
      console.log(`[MOCK] Getting health data for ${this.baseUrl}`);
      return MOCK_HEALTH_DATA;
    }
    
    try {
      const url = this.getEndpointUrl(this.endpoints.health);
      console.log(`Fetching health from: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 3000,
        validateStatus: () => true // Accept any status to handle DOWN states
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching health data:', error);
      return { status: 'DOWN', error: 'Connection failed' };
    }
  }

  /**
   * Get application build and version information
   * 
   * Retrieves metadata about the Spring Boot application including version numbers,
   * build timestamps, git commit information, and other custom info exposed 
   * through the /info endpoint.
   * 
   * @returns Object containing application metadata and version information
   */
  async getInfo() {
    if (this.useMockData) {
      console.log(`[MOCK] Getting info data for ${this.baseUrl}`);
      return MOCK_INFO_DATA;
    }
    
    try {
      const url = this.getEndpointUrl(this.endpoints.info);
      console.log(`Fetching info from: ${url}`);
      
      const response = await axios.get(url, { timeout: 2000 });
      return response.data;
    } catch (error) {
      console.error('Error fetching info data:', error);
      return {};
    }
  }

  /**
   * Retrieve performance metrics from the Spring Boot application
   * 
   * Collects various metrics from the /metrics endpoint including:
   * - Memory usage (used/max)
   * - CPU utilization
   * - HTTP request statistics and error counts
   * 
   * The method first retrieves available metric names and then fetches
   * specific metrics of interest. The data is aggregated into a structured
   * format for easy consumption by the dashboard.
   * 
   * @returns Object containing various performance metrics
   */
  async getMetrics() {
    if (this.useMockData) {
      console.log(`[MOCK] Getting metrics data for ${this.baseUrl}`);
      return MOCK_METRICS;
    }
    
    try {
      // First get available metric names
      const metricsUrl = this.getEndpointUrl(this.endpoints.metrics);
      console.log(`Fetching metrics from: ${metricsUrl}`);
      
      const metricsResponse = await axios.get(metricsUrl, { timeout: 3000 });
      const availableMetrics = metricsResponse.data.names || [];

      // Collect the metrics we're interested in
      const metrics: Record<string, any> = {};
      
      // Memory metrics
      if (availableMetrics.includes('jvm.memory.used')) {
        const memoryUsedUrl = `${metricsUrl}/jvm.memory.used`;
        const memoryUsedResponse = await axios.get(memoryUsedUrl, { timeout: 2000 });
        metrics.memoryUsed = memoryUsedResponse.data;
      }
      
      if (availableMetrics.includes('jvm.memory.max')) {
        const memoryMaxUrl = `${metricsUrl}/jvm.memory.max`;
        const memoryMaxResponse = await axios.get(memoryMaxUrl, { timeout: 2000 });
        metrics.memoryMax = memoryMaxResponse.data;
      }
      
      // CPU metrics
      if (availableMetrics.includes('process.cpu.usage')) {
        const cpuUrl = `${metricsUrl}/process.cpu.usage`;
        const cpuResponse = await axios.get(cpuUrl, { timeout: 2000 });
        metrics.cpuUsage = cpuResponse.data;
      }
      
      // HTTP metrics (errors)
      if (availableMetrics.includes('http.server.requests')) {
        const httpUrl = `${metricsUrl}/http.server.requests`;
        const httpResponse = await axios.get(httpUrl, { timeout: 2000 });
        metrics.httpRequests = httpResponse.data;
      }
      
      return metrics;
    } catch (error) {
      console.error('Error fetching metrics data:', error);
      return {};
    }
  }

  /**
   * Retrieve application logs from the Spring Boot service
   * 
   * Fetches log entries from the /logfile endpoint or falls back to logger
   * configuration if logs are not directly accessible. The method supports
   * limiting the number of log entries to prevent overwhelming the client.
   * 
   * The logs are parsed to extract timestamp, log level, and message content
   * for structured display in the UI.
   * 
   * @param limit Maximum number of log entries to retrieve (defaults to 100)
   * @returns Array of log entries or logger configuration if logs unavailable
   */
  async getLogs(limit = 100) {
    if (this.useMockData) {
      console.log(`[MOCK] Getting logs for ${this.baseUrl}`);
      // Return a subset of logs
      return MOCK_LOGS.slice(-limit);
    }
    
    try {
      // Try to access logfile endpoint (if configured)
      const logfileUrl = this.getEndpointUrl(this.endpoints.logfile);
      console.log(`Fetching logs from: ${logfileUrl}`);
      
      const response = await axios.get(logfileUrl, { 
        timeout: 5000,
        validateStatus: (status) => status < 500 // Accept 404s
      });
      
      if (response.status === 200) {
        const logLines = response.data.split('\n');
        // Return the last 'limit' lines
        return logLines.slice(-limit);
      }
      
      // If logfile not available, try using loggers endpoint
      const loggersUrl = `${this.baseUrl}${this.actuatorBasePath}/loggers`;
      const loggersResponse = await axios.get(loggersUrl, { timeout: 2000 });
      
      return {
        message: 'Log file not directly accessible, using logger configuration',
        loggers: loggersResponse.data.loggers
      };
    } catch (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
  }

  /**
   * Retrieve available loggers and their configured levels
   * 
   * Fetches the list of available loggers from the /loggers endpoint, including
   * both the configured level (explicitly set) and effective level (inherited).
   * This information is used to present users with logger configuration options
   * and to show the current logging state.
   * 
   * @returns Object containing available log levels and configured loggers
   */
  async getLoggers() {
    if (this.useMockData) {
      console.log(`[MOCK] Getting loggers for ${this.baseUrl}`);
      return {
        levels: ["OFF", "ERROR", "WARN", "INFO", "DEBUG", "TRACE"],
        loggers: {
          "ROOT": {
            configuredLevel: "INFO",
            effectiveLevel: "INFO"
          },
          "com.example": {
            configuredLevel: "INFO",
            effectiveLevel: "INFO"
          },
          "org.springframework": {
            configuredLevel: null,
            effectiveLevel: "INFO"
          },
          "org.springframework.web": {
            configuredLevel: null,
            effectiveLevel: "INFO"
          }
        }
      };
    }
    
    try {
      const loggersUrl = `${this.baseUrl}${this.actuatorBasePath}/loggers`;
      console.log(`Fetching loggers from: ${loggersUrl}`);
      
      const response = await axios.get(loggersUrl, { timeout: 3000 });
      return response.data;
    } catch (error) {
      console.error('Error fetching loggers:', error);
      return { levels: [], loggers: {} };
    }
  }
  
  // Set the log level for a specific logger
  async setLogLevel(loggerName: string, level: string) {
    if (this.useMockData) {
      console.log(`[MOCK] Setting log level for ${loggerName} to ${level} on ${this.baseUrl}`);
      return true;
    }
    
    try {
      const loggerUrl = `${this.baseUrl}${this.actuatorBasePath}/loggers/${loggerName}`;
      console.log(`Setting log level for ${loggerName} to ${level} on ${loggerUrl}`);
      
      await axios.post(loggerUrl, { configuredLevel: level }, { 
        timeout: 3000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      return true;
    } catch (error) {
      console.error(`Error setting log level for ${loggerName}:`, error);
      return false;
    }
  }
}

// Create a new actuator client
export function createActuatorClient(actuatorUrl: string) {
  return new ActuatorClient(actuatorUrl);
}
