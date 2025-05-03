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
  '2023-05-03 10:15:30.123 INFO  [main] Starting Spring Boot application',
  '2023-05-03 10:15:31.456 INFO  [main] Initializing database connection',
  '2023-05-03 10:15:32.789 INFO  [main] Database connection established',
  '2023-05-03 10:15:33.012 INFO  [main] Loading application context',
  '2023-05-03 10:15:34.345 INFO  [main] Application started successfully',
  '2023-05-03 10:16:01.678 INFO  [http-nio-8080-exec-1] Processing request: GET /api/products',
  '2023-05-03 10:16:02.901 INFO  [http-nio-8080-exec-1] Request processed successfully',
  '2023-05-03 10:16:15.234 WARN  [http-nio-8080-exec-2] Slow query detected, took 1500ms',
  '2023-05-03 10:16:30.567 ERROR [http-nio-8080-exec-3] Failed to process request: /api/invalid',
  '2023-05-03 10:16:31.890 ERROR [http-nio-8080-exec-3] java.lang.NullPointerException: Cannot invoke method on null object',
  '2023-05-03 10:17:45.123 INFO  [http-nio-8080-exec-4] Processing request: GET /api/orders',
  '2023-05-03 10:17:46.456 DEBUG [http-nio-8080-exec-4] Query execution time: 34ms',
  '2023-05-03 10:17:47.789 INFO  [http-nio-8080-exec-4] Request processed successfully'
];

// Client for interacting with Spring Boot Actuator endpoints
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
  
  // Get health check information
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

  // Get application info (if available)
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

  // Get metrics (if available)
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

  // Get log file (if available)
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

  // Get available loggers and their levels
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
