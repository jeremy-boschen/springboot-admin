import { 
  InsertService, 
  InsertMetric, 
  InsertLog, 
  User, 
  InsertUser, 
  Service, 
  Metric, 
  Log, 
  ServiceStatus,
  ConfigProperty,
  InsertConfigProperty
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Service methods
  getAllServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  getServiceByPodName(podName: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, data: Partial<InsertService>): Promise<Service>;
  updateServiceStatus(id: number, status: ServiceStatus): Promise<Service>;
  deleteService(id: number): Promise<void>;
  
  // Metrics methods
  getMetricsForService(serviceId: number, limit?: number): Promise<Metric[]>;
  createMetric(metric: InsertMetric): Promise<Metric>;
  
  // Logs methods
  getLogsForService(serviceId: number, limit?: number): Promise<Log[]>;
  createLog(log: InsertLog): Promise<Log>;
  
  // Configuration methods
  getConfigPropertiesForService(serviceId: number): Promise<ConfigProperty[]>;
  getConfigProperty(id: number): Promise<ConfigProperty | undefined>;
  createConfigProperty(property: InsertConfigProperty): Promise<ConfigProperty>;
  updateConfigProperty(id: number, data: Partial<InsertConfigProperty>): Promise<ConfigProperty>;
  deleteConfigProperty(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private services: Map<number, Service>;
  private metrics: Map<number, Metric[]>;
  private logs: Map<number, Log[]>;
  private configProperties: Map<number, ConfigProperty[]>;
  
  private currentUserId: number;
  private currentServiceId: number;
  private currentMetricId: number;
  private currentLogId: number;
  private currentConfigPropertyId: number;

  constructor() {
    this.users = new Map();
    this.services = new Map();
    this.metrics = new Map();
    this.logs = new Map();
    this.configProperties = new Map();
    
    this.currentUserId = 1;
    this.currentServiceId = 1;
    this.currentMetricId = 1;
    this.currentLogId = 1;
    this.currentConfigPropertyId = 1;
    
    // Do NOT initialize mock data - we'll let the service discovery process handle this
    // based on the configuration (real K8s vs development mode)
  }
  
  private initializeMockData() {
    // Add mock config properties for customer-service (ID 1)
    const customerServiceConfigProps = [
      {
        id: this.currentConfigPropertyId++,
        serviceId: 1,
        key: "spring.application.name",
        value: "customer-service",
        type: "STRING",
        source: "application.properties",
        description: "The name of the application",
        isActive: true,
        lastUpdated: new Date()
      },
      {
        id: this.currentConfigPropertyId++,
        serviceId: 1,
        key: "server.port",
        value: "8080",
        type: "NUMBER",
        source: "application.properties",
        description: "The server port",
        isActive: true,
        lastUpdated: new Date()
      },
      {
        id: this.currentConfigPropertyId++,
        serviceId: 1,
        key: "spring.datasource.url",
        value: "jdbc:postgresql://localhost:5432/customers",
        type: "STRING",
        source: "application.properties",
        description: "Database connection URL",
        isActive: true,
        lastUpdated: new Date()
      },
      {
        id: this.currentConfigPropertyId++,
        serviceId: 1,
        key: "logging.level.root",
        value: "INFO",
        type: "STRING",
        source: "application.yml",
        description: "Root logging level",
        isActive: true,
        lastUpdated: new Date()
      },
      {
        id: this.currentConfigPropertyId++,
        serviceId: 1,
        key: "management.endpoints.web.exposure.include",
        value: "*",
        type: "STRING",
        source: "application.yml",
        description: "Expose all actuator endpoints",
        isActive: true,
        lastUpdated: new Date()
      }
    ];
    
    // Add config properties
    this.configProperties.set(1, customerServiceConfigProps);
    
    // Add mock logs for customer-service (ID 1)
    const now = new Date();
    const customerServiceLogs = [
      {
        id: this.currentLogId++,
        serviceId: 1,
        timestamp: new Date(now.getTime() - 500),
        message: "Application started successfully",
        level: "INFO"
      },
      {
        id: this.currentLogId++,
        serviceId: 1,
        timestamp: new Date(now.getTime() - 400),
        message: "Connected to database customers",
        level: "INFO"
      },
      {
        id: this.currentLogId++,
        serviceId: 1,
        timestamp: new Date(now.getTime() - 300),
        message: "Failed to validate customer data: Missing email",
        level: "ERROR"
      },
      {
        id: this.currentLogId++,
        serviceId: 1,
        timestamp: new Date(now.getTime() - 200),
        message: "JPA repository initialized",
        level: "DEBUG"
      },
      {
        id: this.currentLogId++,
        serviceId: 1,
        timestamp: new Date(now.getTime() - 100),
        message: "Customer created: ID=12345",
        level: "INFO"
      },
      {
        id: this.currentLogId++,
        serviceId: 1,
        timestamp: new Date(),
        message: "API request received: GET /api/customers/12345",
        level: "INFO"
      }
    ];
    
    // Add logs
    this.logs.set(1, customerServiceLogs);
    
    // Add mock config properties for order-service (ID 2)
    const orderServiceConfigProps = [
      {
        id: this.currentConfigPropertyId++,
        serviceId: 2,
        key: "spring.application.name",
        value: "order-service",
        type: "STRING",
        source: "application.properties",
        description: "The name of the application",
        isActive: true,
        lastUpdated: new Date()
      },
      {
        id: this.currentConfigPropertyId++,
        serviceId: 2,
        key: "server.port",
        value: "8080",
        type: "NUMBER",
        source: "application.properties",
        description: "The server port",
        isActive: true,
        lastUpdated: new Date()
      },
      {
        id: this.currentConfigPropertyId++,
        serviceId: 2,
        key: "spring.datasource.url",
        value: "jdbc:postgresql://localhost:5432/orders",
        type: "STRING",
        source: "application.properties",
        description: "Database connection URL",
        isActive: true,
        lastUpdated: new Date()
      }
    ];
    
    // Add config properties
    this.configProperties.set(2, orderServiceConfigProps);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Service methods
  async getAllServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }
  
  async getService(id: number): Promise<Service | undefined> {
    return this.services.get(id);
  }
  
  async getServiceByPodName(podName: string): Promise<Service | undefined> {
    return Array.from(this.services.values()).find(
      (service) => service.podName === podName,
    );
  }
  
  async createService(insertService: InsertService): Promise<Service> {
    const id = this.currentServiceId++;
    const service: Service = { 
      ...insertService, 
      id, 
      lastUpdated: new Date()
    };
    this.services.set(id, service);
    
    // Initialize empty arrays for metrics and logs
    this.metrics.set(id, []);
    this.logs.set(id, []);
    
    return service;
  }
  
  async updateService(id: number, data: Partial<InsertService>): Promise<Service> {
    const service = this.services.get(id);
    if (!service) {
      throw new Error(`Service with id ${id} not found`);
    }
    
    const updatedService: Service = { 
      ...service, 
      ...data, 
      lastUpdated: new Date()
    };
    
    this.services.set(id, updatedService);
    return updatedService;
  }
  
  async updateServiceStatus(id: number, status: ServiceStatus): Promise<Service> {
    return this.updateService(id, { status });
  }
  
  async deleteService(id: number): Promise<void> {
    this.services.delete(id);
    this.metrics.delete(id);
    this.logs.delete(id);
  }
  
  // Metrics methods
  async getMetricsForService(serviceId: number, limit = 100): Promise<Metric[]> {
    const serviceMetrics = this.metrics.get(serviceId) || [];
    // Return the most recent metrics first
    return [...serviceMetrics].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, limit);
  }
  
  async createMetric(insertMetric: InsertMetric): Promise<Metric> {
    const id = this.currentMetricId++;
    const metric: Metric = { 
      ...insertMetric, 
      id, 
      timestamp: new Date() 
    };
    
    const serviceMetrics = this.metrics.get(insertMetric.serviceId) || [];
    serviceMetrics.push(metric);
    this.metrics.set(insertMetric.serviceId, serviceMetrics);
    
    return metric;
  }
  
  // Logs methods
  async getLogsForService(serviceId: number, limit = 100): Promise<Log[]> {
    const serviceLogs = this.logs.get(serviceId) || [];
    // Return the most recent logs first
    return [...serviceLogs].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, limit);
  }
  
  async createLog(insertLog: InsertLog): Promise<Log> {
    const id = this.currentLogId++;
    const log: Log = { 
      ...insertLog, 
      id, 
      timestamp: new Date()
    };
    
    const serviceLogs = this.logs.get(insertLog.serviceId) || [];
    serviceLogs.push(log);
    this.logs.set(insertLog.serviceId, serviceLogs);
    
    return log;
  }
  
  // Configuration methods
  async getConfigPropertiesForService(serviceId: number): Promise<ConfigProperty[]> {
    return this.configProperties.get(serviceId) || [];
  }
  
  async getConfigProperty(id: number): Promise<ConfigProperty | undefined> {
    for (const [_, properties] of this.configProperties.entries()) {
      const property = properties.find(prop => prop.id === id);
      if (property) {
        return property;
      }
    }
    return undefined;
  }
  
  async createConfigProperty(insertProperty: InsertConfigProperty): Promise<ConfigProperty> {
    const id = this.currentConfigPropertyId++;
    const property: ConfigProperty = {
      ...insertProperty,
      id,
      lastUpdated: new Date()
    };
    
    const serviceProperties = this.configProperties.get(insertProperty.serviceId) || [];
    serviceProperties.push(property);
    this.configProperties.set(insertProperty.serviceId, serviceProperties);
    
    return property;
  }
  
  async updateConfigProperty(id: number, data: Partial<InsertConfigProperty>): Promise<ConfigProperty> {
    // Find the property to update
    for (const [serviceId, properties] of this.configProperties.entries()) {
      const index = properties.findIndex(prop => prop.id === id);
      if (index !== -1) {
        const property = properties[index];
        const updatedProperty: ConfigProperty = {
          ...property,
          ...data,
          lastUpdated: new Date()
        };
        
        // Update the property in the array
        const updatedProperties = [...properties];
        updatedProperties[index] = updatedProperty;
        this.configProperties.set(serviceId, updatedProperties);
        
        return updatedProperty;
      }
    }
    
    throw new Error(`Config property with id ${id} not found`);
  }
  
  async deleteConfigProperty(id: number): Promise<void> {
    for (const [serviceId, properties] of this.configProperties.entries()) {
      const updatedProperties = properties.filter(prop => prop.id !== id);
      if (updatedProperties.length !== properties.length) {
        this.configProperties.set(serviceId, updatedProperties);
        return;
      }
    }
    
    throw new Error(`Config property with id ${id} not found`);
  }
}

export const storage = new MemStorage();
