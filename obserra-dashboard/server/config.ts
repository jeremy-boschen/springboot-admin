import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { z } from 'zod';

// Configuration schema
const ConfigSchema = z.object({
  server: z.object({
    port: z.number().default(3000),
    host: z.string().default('0.0.0.0'),
  }),
  kubernetes: z.object({
    kubeconfig: z.string().optional(),
    namespace: z.string().optional(),
    serviceDiscoveryInterval: z.number().default(60000),
  }),
  actuator: z.object({
    defaultPort: z.number().default(8080),
    basePath: z.string().default('/actuator'),
    endpoints: z.object({
      health: z.string().default('/health'),
      info: z.string().default('/info'),
      metrics: z.string().default('/metrics'),
      logfile: z.string().default('/logfile'),
    }),
    managementPortAnnotation: z.string().default('spring-boot/management-port'),
    managementContextPathAnnotation: z.string().default('spring-boot/management-context-path'),
  }),
  healthCheck: z.object({
    intervalMs: z.number().default(30000), // Default is 30 seconds
    timeoutMs: z.number().default(5000),   // Default is 5 seconds
    retryCount: z.number().default(3),     // Default is 3 retries
    retryDelayMs: z.number().default(5000) // Default is 5 seconds
  }),
  metrics: z.object({
    collectionInterval: z.number().default(30000),
    retention: z.object({
      days: z.number().default(7),
      maxEntries: z.number().default(1000),
    }),
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  }),
  logs: z.object({
    recentLimit: z.number().default(10),
    websocketEnabled: z.boolean().default(true),
    refreshInterval: z.number().default(5000),
  }),
});

// Configuration type
export type AppConfig = z.infer<typeof ConfigSchema>;

// Default configuration
const defaultConfig: AppConfig = {
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  kubernetes: {
    serviceDiscoveryInterval: 60000,
  },
  actuator: {
    defaultPort: 8080,
    basePath: '/actuator',
    endpoints: {
      health: '/health',
      info: '/info',
      metrics: '/metrics',
      logfile: '/logfile',
    },
    managementPortAnnotation: 'spring-boot/management-port',
    managementContextPathAnnotation: 'spring-boot/management-context-path',
  },
  healthCheck: {
    intervalMs: 30000,
    timeoutMs: 5000,
    retryCount: 3,
    retryDelayMs: 5000
  },
  metrics: {
    collectionInterval: 30000,
    retention: {
      days: 7,
      maxEntries: 1000,
    },
  },
  logging: {
    level: 'info',
  },
  logs: {
    recentLimit: 10,
    websocketEnabled: true,
    refreshInterval: 5000,
  },
};

class ConfigHandler {
  private config: AppConfig = defaultConfig;

  constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      // Check for config file path from environment variable
      const configPath = process.env.CONFIG_PATH;

      // Check for config map path from environment variable
      const configMapPath = process.env.CONFIG_MAP_PATH;

      // Priority: 1. CONFIG_PATH, 2. CONFIG_MAP_PATH, 3. Default './config.yaml'
      const filePath = configPath || configMapPath || './config.yaml';

      if (fs.existsSync(filePath)) {
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const loadedConfig = yaml.load(fileContents) as Record<string, any>;

        // Deep merge with default config
        this.config = this.mergeConfigs(defaultConfig, loadedConfig);

        // Validate config against schema
        const validatedConfig = ConfigSchema.parse(this.config);
        this.config = validatedConfig;

        console.log(`Configuration loaded from ${filePath}`);
      } else {
        console.log(`No configuration file found at ${filePath}, using default configuration`);
      }

      // Override with environment variables if they exist
      this.applyEnvironmentVariables();

    } catch (error) {
      console.error('Error loading configuration:', error);
      console.log('Using default configuration');
    }
  }

  private mergeConfigs(defaultConfig: any, loadedConfig: any): any {
    const result = { ...defaultConfig };

    for (const key in loadedConfig) {
      if (typeof loadedConfig[key] === 'object' && loadedConfig[key] !== null && key in defaultConfig) {
        result[key] = this.mergeConfigs(defaultConfig[key], loadedConfig[key]);
      } else {
        result[key] = loadedConfig[key];
      }
    }

    return result;
  }

  private applyEnvironmentVariables(): void {
    // Server settings
    if (process.env.SERVER_PORT) {
      this.config.server.port = parseInt(process.env.SERVER_PORT, 10);
    }
    if (process.env.SERVER_HOST) {
      this.config.server.host = process.env.SERVER_HOST;
    }

    // Kubernetes settings
    if (process.env.KUBERNETES_KUBECONFIG) {
      this.config.kubernetes.kubeconfig = process.env.KUBERNETES_KUBECONFIG;
    }
    if (process.env.KUBERNETES_NAMESPACE) {
      this.config.kubernetes.namespace = process.env.KUBERNETES_NAMESPACE;
    }
    if (process.env.KUBERNETES_SERVICE_DISCOVERY_INTERVAL) {
      this.config.kubernetes.serviceDiscoveryInterval = parseInt(process.env.KUBERNETES_SERVICE_DISCOVERY_INTERVAL, 10);
    }

    // Actuator settings
    if (process.env.ACTUATOR_DEFAULT_PORT) {
      this.config.actuator.defaultPort = parseInt(process.env.ACTUATOR_DEFAULT_PORT, 10);
    }
    if (process.env.ACTUATOR_BASE_PATH) {
      this.config.actuator.basePath = process.env.ACTUATOR_BASE_PATH;
    }
    if (process.env.ACTUATOR_ENDPOINT_HEALTH) {
      this.config.actuator.endpoints.health = process.env.ACTUATOR_ENDPOINT_HEALTH;
    }
    if (process.env.ACTUATOR_ENDPOINT_INFO) {
      this.config.actuator.endpoints.info = process.env.ACTUATOR_ENDPOINT_INFO;
    }
    if (process.env.ACTUATOR_ENDPOINT_METRICS) {
      this.config.actuator.endpoints.metrics = process.env.ACTUATOR_ENDPOINT_METRICS;
    }
    if (process.env.ACTUATOR_ENDPOINT_LOGFILE) {
      this.config.actuator.endpoints.logfile = process.env.ACTUATOR_ENDPOINT_LOGFILE;
    }

    // Metrics settings
    if (process.env.METRICS_COLLECTION_INTERVAL) {
      this.config.metrics.collectionInterval = parseInt(process.env.METRICS_COLLECTION_INTERVAL, 10);
    }

    // Logging settings
    if (process.env.LOGGING_LEVEL && ['debug', 'info', 'warn', 'error'].includes(process.env.LOGGING_LEVEL)) {
      this.config.logging.level = process.env.LOGGING_LEVEL as 'debug' | 'info' | 'warn' | 'error';
    }
  }

  public getConfig(): AppConfig {
    return this.config;
  }
}

// Singleton instance
export const configHandler = new ConfigHandler();
export const config = configHandler.getConfig();

export default config;
