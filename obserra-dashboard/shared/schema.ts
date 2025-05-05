import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Spring Boot application services
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  namespace: text("namespace").notNull().default("default"),
  version: text("version").notNull().default("unknown"),
  podName: text("pod_name"), // May be null for directly registered services
  status: text("status").notNull().default("UNKNOWN"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  lastSeen: timestamp("last_seen"), // Timestamp of last successful health check
  clusterDns: text("cluster_dns"), // May be null for directly registered services
  actuatorUrl: text("actuator_url").notNull(),
  healthCheckPath: text("health_check_path"), // Custom health check path (if provided)
  registrationSource: text("registration_source").notNull().default("kubernetes"), // kubernetes, direct, or manual
  hostAddress: text("host_address"), // Direct IP or hostname for directly registered services
  port: integer("port"), // Port number for directly registered services
  contextPath: text("context_path"), // Application context path (if not at root)
  appId: text("app_id"), // Unique application identifier (may be used for re-registration)
  metricsPath: text("metrics_path"), // Path to metrics endpoint (if custom)
  logsPath: text("logs_path"), // Path to logs endpoint (if custom)
  configPath: text("config_path"), // Path to configuration endpoint (if custom)
  autoRegister: boolean("auto_register").notNull().default(false), // Whether to auto re-register on restart
  healthCheckInterval: integer("health_check_interval"), // Custom health check interval in seconds
});

// Service metrics
export const metrics = pgTable("metrics", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").notNull().references(() => services.id),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  memoryUsed: real("memory_used").notNull(),
  memoryMax: real("memory_max").notNull(),
  cpuUsage: real("cpu_usage").notNull(),
  errorCount: integer("error_count").notNull().default(0),
  metricData: jsonb("metric_data").notNull(),
});

// Service logs
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").notNull().references(() => services.id),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  level: text("level").notNull().default("INFO"),
  message: text("message").notNull(),
});

// Insert schemas
export const insertServiceSchema = createInsertSchema(services).omit({ 
  id: true,
  lastUpdated: true
});

export const insertMetricSchema = createInsertSchema(metrics).omit({ 
  id: true,
  timestamp: true
});

export const insertLogSchema = createInsertSchema(logs).omit({ 
  id: true,
  timestamp: true
});

// Types
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Metric = typeof metrics.$inferSelect;
export type InsertMetric = z.infer<typeof insertMetricSchema>;

export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;

// Frontend-specific types
export const ServiceStatusEnum = z.enum(["UP", "DOWN", "WARNING", "UNKNOWN"]);
export type ServiceStatus = z.infer<typeof ServiceStatusEnum>;

// Registration source types
export const RegistrationSourceEnum = z.enum(["kubernetes", "direct", "manual"]);
export type RegistrationSource = z.infer<typeof RegistrationSourceEnum>;

// Service registration schema
export const serviceRegistrationSchema = z.object({
  // Required fields
  name: z.string().min(1, "Service name is required"),
  actuatorUrl: z.string().url("A valid actuator base URL is required"),
  
  // Optional fields with defaults
  appId: z.string().optional(),
  version: z.string().optional(),
  healthCheckPath: z.string().optional().default("/actuator/health"),
  metricsPath: z.string().optional().default("/actuator/metrics"),
  logsPath: z.string().optional().default("/actuator/logfile"),
  configPath: z.string().optional().default("/actuator/env"),
  healthCheckInterval: z.number().int().positive().optional().default(30),
  autoRegister: z.boolean().optional().default(false),
  
  // Connection details
  hostAddress: z.string().optional(),
  port: z.number().int().positive().optional(),
  contextPath: z.string().optional().default(""),
});

export type ServiceRegistration = z.infer<typeof serviceRegistrationSchema>;

export interface ServiceDetail extends Service {
  memory?: {
    used: number;
    max: number;
    trend: number[];
  };
  cpu?: {
    used: number;
    max: number;
    trend: number[];
  };
  errors?: {
    count: number;
    trend: number[];
  };
  logs?: Log[];
}

export interface MetricTrend {
  timestamp: Date;
  value: number;
}

// Configuration property types
export const PropertyTypeEnum = z.enum(["STRING", "NUMBER", "BOOLEAN", "ARRAY", "MAP", "JSON", "YAML"]);
export type PropertyType = z.infer<typeof PropertyTypeEnum>;

// User types
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name"),
  email: text("email"),
  passwordHash: text("password_hash"),
  role: text("role", { enum: ["admin", "user"] }).notNull().default("user")
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const configProperties = pgTable("config_properties", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  value: text("value").notNull(),
  type: text("type", { enum: ["STRING", "NUMBER", "BOOLEAN", "ARRAY", "MAP", "JSON", "YAML"] }).notNull().default("STRING"),
  description: text("description"),
  source: text("source").notNull().default("application.properties"),
  isActive: boolean("is_active").notNull().default(true),
  lastUpdated: timestamp("last_updated").defaultNow()
});

export const insertConfigPropertySchema = createInsertSchema(configProperties).omit({ 
  id: true,
  lastUpdated: true
});

export type ConfigProperty = typeof configProperties.$inferSelect;
export type InsertConfigProperty = z.infer<typeof insertConfigPropertySchema>;
