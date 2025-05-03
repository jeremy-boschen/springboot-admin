import { useState } from "react";
import { ServiceDetailProps } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetricsChart } from "@/components/services/metrics-chart";
import { LogTable } from "@/components/services/log-table";
import { LogLevelManager } from "@/components/services/log-level-manager";
import { getStatusColor, getResourceUtilizationClass } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ArrowLeft, RefreshCw, Power } from "lucide-react";

export function ServiceDetail({ service, onBack, refreshService }: ServiceDetailProps) {
  const [logLevel, setLogLevel] = useState("ALL");
  const statusColor = getStatusColor(service.status);

  const memoryPercentage = service.memory 
    ? (service.memory.used / service.memory.max) * 100
    : 0;
  
  const cpuPercentage = service.cpu 
    ? service.cpu.used * 100 
    : 0;

  const filteredLogs = service.logs 
    ? logLevel === "ALL" 
      ? service.logs 
      : service.logs.filter(log => log.level === logLevel)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="mr-3 p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
          <span className={cn("inline-block w-2.5 h-2.5 rounded-full mr-2", statusColor.bg)}></span>
          <span>{service.name}</span>
          <Badge 
            variant="outline" 
            className={cn(
              "ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium",
              statusColor.bgLight, statusColor.textLight, statusColor.bgDark, statusColor.textDark
            )}
          >
            {service.status}
          </Badge>
        </h1>
      </div>

      <Card>
        <CardHeader className="px-6 py-5 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg leading-6 font-medium">Service Information</CardTitle>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Details and metrics for this Spring Boot service.
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              size="sm"
              className="inline-flex items-center text-white bg-primary-600 hover:bg-primary-700"
              onClick={refreshService}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Restart
            </Button>
            <Button 
              size="sm"
              variant="outline"
              className="inline-flex items-center border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              View in Kubernetes
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0 py-0">
          <dl>
            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-5 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Service Name</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-300 col-span-2">{service.name}</dd>
            </div>
            <div className="bg-white dark:bg-gray-800 px-6 py-5 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Version</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-300 col-span-2">v{service.version}</dd>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-5 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Namespace</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-300 col-span-2">{service.namespace}</dd>
            </div>
            <div className="bg-white dark:bg-gray-800 px-6 py-5 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Pod Name</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-300 col-span-2">{service.podName}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Metrics Section */}
      <Card>
        <CardHeader className="px-6 py-5">
          <CardTitle className="text-lg leading-6 font-medium">Resources & Metrics</CardTitle>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Current resource utilization and metrics.
          </p>
        </CardHeader>
        <CardContent className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Memory usage */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Memory Usage</div>
              <div className="mt-1 flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {service.memory ? `${service.memory.used} MB` : "--"}
                </div>
                <div className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  {service.memory ? `of ${service.memory.max} MB` : ""}
                </div>
              </div>
              <div className="mt-3">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={cn("h-2 rounded-full", getResourceUtilizationClass(memoryPercentage))}
                    style={{ width: `${memoryPercentage}%` }}
                  ></div>
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {service.memory ? `${memoryPercentage.toFixed(1)}% utilized` : "No data available"}
                </div>
              </div>
              <div className="mt-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">Trend (Last Hour)</div>
                <div className="mt-2">
                  {service.memory?.trend ? (
                    <MetricsChart 
                      data={service.memory.trend.map(value => (value / 100) * 100)} 
                      height={64}
                      colorThresholds={{ warning: 70, error: 90 }}
                    />
                  ) : (
                    <div className="h-16 w-full bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">No trend data</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CPU usage */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">CPU Usage</div>
              <div className="mt-1 flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {service.cpu ? `${cpuPercentage.toFixed(0)}%` : "--"}
                </div>
                <div className="ml-2 text-sm text-gray-500 dark:text-gray-400">of available</div>
              </div>
              <div className="mt-3">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={cn("h-2 rounded-full", getResourceUtilizationClass(cpuPercentage))}
                    style={{ width: `${cpuPercentage}%` }}
                  ></div>
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {service.cpu ? `${cpuPercentage.toFixed(1)}% utilized` : "No data available"}
                </div>
              </div>
              <div className="mt-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">Trend (Last Hour)</div>
                <div className="mt-2">
                  {service.cpu?.trend ? (
                    <MetricsChart 
                      data={service.cpu.trend} 
                      height={64}
                      colorThresholds={{ warning: 70, error: 90 }}
                    />
                  ) : (
                    <div className="h-16 w-full bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">No trend data</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Error rate */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Error Rate</div>
              <div className="mt-1 flex items-baseline">
                <div className={cn(
                  "text-2xl font-semibold",
                  !service.errors?.count 
                    ? "text-success-600 dark:text-success-500"
                    : service.errors.count < 5
                      ? "text-warning-600 dark:text-warning-500"
                      : "text-error-600 dark:text-error-500"
                )}>
                  {service.errors?.count ?? 0}
                </div>
                <div className="ml-2 text-sm text-gray-500 dark:text-gray-400">errors last 24h</div>
              </div>
              <div className="mt-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">Trend (Last Hour)</div>
                <div className="mt-2">
                  {service.errors?.trend ? (
                    <MetricsChart 
                      data={service.errors.trend.map(value => value === 0 ? 5 : (value * 30))} 
                      height={64}
                      colorThresholds={{ warning: 30, error: 60 }}
                    />
                  ) : (
                    <div className="h-16 w-full bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">No trend data</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Level Management Section */}
      {service.id && <LogLevelManager serviceId={service.id} />}

      {/* Logs Section */}
      <Card>
        <CardHeader className="px-6 py-5 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg leading-6 font-medium">Recent Logs</CardTitle>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Last log entries from the service.
            </p>
          </div>
          <div className="flex space-x-2">
            <Select 
              defaultValue="ALL" 
              onValueChange={setLogLevel}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Levels</SelectItem>
                <SelectItem value="ERROR">ERROR</SelectItem>
                <SelectItem value="WARNING">WARNING</SelectItem>
                <SelectItem value="INFO">INFO</SelectItem>
                <SelectItem value="DEBUG">DEBUG</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              size="sm"
              variant="outline"
              className="inline-flex items-center border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Download Logs
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 border-t border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <LogTable logs={filteredLogs} />
          </div>
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredLogs.length}</span> of <span className="font-medium">{filteredLogs.length}</span> results
                </p>
              </div>
              {/* Pagination would go here */}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
