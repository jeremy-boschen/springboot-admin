import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// K8s Service with Spring Boot application
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  namespace: text("namespace").notNull(),
  version: text("version").notNull().default("unknown"),
  podName: text("pod_name").notNull(),
  status: text("status").notNull().default("UNKNOWN"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  clusterDns: text("cluster_dns").notNull(),
  actuatorUrl: text("actuator_url").notNull(),
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
