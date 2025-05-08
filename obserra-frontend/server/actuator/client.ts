import axios from 'axios';
import config from '../config';

// Default responses when no real data is available
const DEFAULT_HEALTH_DATA = {
  status: 'UNKNOWN',
  components: {}
};

const DEFAULT_INFO_DATA = {
  build: {
    version: 'unknown',
    artifact: 'unknown',
    name: 'Unknown Application',
    time: new Date().toISOString(),
    group: 'unknown'
  }
};

const DEFAULT_METRICS_DATA = {
  names: []
};

const DEFAULT_METRICS = {};

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
    // baseUrl already contains actuatorBasePath, so we just append the endpoint
    return `${this.baseUrl}${endpoint}`;
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
      console.log(`[Development] Getting health data for ${this.baseUrl}`);
      return DEFAULT_HEALTH_DATA;
    }

    try {
      const url = this.getEndpointUrl(this.endpoints.health);
      console.log(`Fetching health from: ${url}`);

      const response = await axios.get(url, {
        timeout: 3000
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching health data:', error);

      // Type guard for axios error
      if (axios.isAxiosError(error) && error.response) {
        return {
          status: 'DOWN',
          error: error.message || `Unexpected HTTP status: ${error.response.status}`,
          details: {
            statusCode: error.response.status,
            response: error.response.data
          }
        };
      }

      return {
        status: 'DOWN',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: {
          statusCode: 500,
          response: null
        }
      };
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
      console.log(`[Development] Getting info data for ${this.baseUrl}`);
      return DEFAULT_INFO_DATA;
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
      console.log(`[Development] Getting metrics data for ${this.baseUrl}`);
      return DEFAULT_METRICS;
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
      console.log(`[Development] Getting logs for ${this.baseUrl}`);
      // Return empty array in development mode
      return [];
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
      const loggersUrl = `${this.baseUrl}/loggers`;
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
      console.log(`[Development] Getting loggers for ${this.baseUrl}`);
      return {
        levels: ["OFF", "ERROR", "WARN", "INFO", "DEBUG", "TRACE"],
        loggers: {}
      };
    }

    try {
      const loggersUrl = `${this.baseUrl}/loggers`;
      console.log(`Fetching loggers from: ${loggersUrl}`);

      const response = await axios.get(loggersUrl, { timeout: 3000 });
      return response.data;
    } catch (error) {
      console.error('Error fetching loggers:', error);
      return { levels: [], loggers: {} };
    }
  }

  /**
   * Change the log level for a specific logger at runtime
   * 
   * Updates the configuration of a specific logger through the /loggers endpoint,
   * allowing dynamic log level adjustment for debugging or troubleshooting without
   * requiring application restarts.
   * 
   * This enables users to increase logging verbosity temporarily when diagnosing
   * issues and reduce it when normal operation resumes.
   * 
   * @param loggerName The fully qualified name of the logger to configure
   * @param level The log level to set (e.g., "DEBUG", "INFO", "ERROR")
   * @returns True if successful, false if the operation failed
   */
  async setLogLevel(loggerName: string, level: string) {
    if (this.useMockData) {
      console.log(`[Development] Setting log level for ${loggerName} to ${level} on ${this.baseUrl}`);
      return true;
    }

    try {
      const loggerUrl = `${this.baseUrl}/loggers/${loggerName}`;
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

/**
 * Factory function to create a new ActuatorClient instance
 * 
 * This function provides a convenient way to create properly configured
 * ActuatorClient instances with the appropriate URL for the Spring Boot
 * Actuator endpoints.
 * 
 * @param actuatorUrl The base URL for the Spring Boot Actuator endpoints
 * @returns A configured ActuatorClient instance
 */
export function createActuatorClient(actuatorUrl: string) {
  return new ActuatorClient(actuatorUrl);
}
