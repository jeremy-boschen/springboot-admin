import { 
  InsertService, 
  InsertMetric, 
  InsertLog, 
  User, 
  InsertUser, 
  Service, 
  Metric, 
  Log, 
  ServiceStatus 
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private services: Map<number, Service>;
  private metrics: Map<number, Metric[]>;
  private logs: Map<number, Log[]>;
  
  private currentUserId: number;
  private currentServiceId: number;
  private currentMetricId: number;
  private currentLogId: number;

  constructor() {
    this.users = new Map();
    this.services = new Map();
    this.metrics = new Map();
    this.logs = new Map();
    
    this.currentUserId = 1;
    this.currentServiceId = 1;
    this.currentMetricId = 1;
    this.currentLogId = 1;
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
}

export const storage = new MemStorage();
