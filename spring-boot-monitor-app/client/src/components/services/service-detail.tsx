import React, { useState, useMemo, useEffect } from "react";
import { ServiceDetailProps } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetricsChart } from "@/components/services/metrics-chart";
import { LogTable } from "@/components/services/log-table";
import { LogLevelManager } from "@/components/services/log-level-manager";
import { ConfigManager } from "@/components/services/config-manager-new";
import { FullscreenLogs } from "@/components/services/fullscreen-logs";
import { useWebSocketLogs } from "@/hooks/use-websocket-logs";
import { useToast } from "@/hooks/use-toast";
import { getStatusColor, getResourceUtilizationClass } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { 
  ArrowLeft, RefreshCw, Power, ChevronDown, ChevronUp, 
  Search, X, Filter, Settings, Maximize2, Wifi, WifiOff,
  Link, Check, Copy
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";

/**
 * Service Detail Component
 * 
 * Displays comprehensive information about a single service including:
 * - Basic service information (status, version, namespace)
 * - Resource metrics (CPU, memory usage)
 * - Log level management
 * - Configuration properties 
 * - Real-time and historical logs
 * 
 * Supports deep linking to specific sections via URL parameters
 * and real-time log streaming via WebSockets.
 */
export function ServiceDetail({ 
  service, 
  onBack, 
  refreshService, 
  initialSections = {
    info: true,
    metrics: true,
    loglevels: true,
    config: true,
    logs: true
  }
}: ServiceDetailProps) {
  const [location, setLocation] = useState("");
  const [logLevel, setLogLevel] = useState("ALL");
  const [logSearch, setLogSearch] = useState("");
  const [showFullscreenLogs, setShowFullscreenLogs] = useState(false);
  const [realtimeLogs, setRealtimeLogs] = useState(false);
  const statusColor = getStatusColor(service.status);
  const { toast } = useToast();
  
  // Function to copy section link to clipboard
  const copySectionLink = (section: string) => {
    const url = `${window.location.origin}/service/${service.id}/${section}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Link copied to clipboard",
        description: `URL to the ${section} section has been copied.`,
      });
    }).catch(err => {
      console.error('Failed to copy link: ', err);
      toast({
        title: "Failed to copy link",
        description: "Please try again or copy the URL manually.",
        variant: "destructive",
      });
    });
  };
  
  // State for collapsible sections with deep linking support
  const [infoOpen, setInfoOpen] = useState(initialSections.info);
  const [metricsOpen, setMetricsOpen] = useState(initialSections.metrics);
  const [logLevelOpen, setLogLevelOpen] = useState(initialSections.loglevels);
  const [configOpen, setConfigOpen] = useState(initialSections.config);
  const [logsOpen, setLogsOpen] = useState(initialSections.logs);
  
  // Get the current section from URL if any
  useEffect(() => {
    // Parse the pathname to extract section if present
    const pathParts = window.location.pathname.split('/');
    const section = pathParts.length >= 4 ? pathParts[3] : null;
    
    // Update location for sharing links
    setLocation(window.location.href);
    
    // Set appropriate section open based on URL
    if (section) {
      // Close all sections first
      setInfoOpen(false);
      setMetricsOpen(false);
      setLogLevelOpen(false);
      setConfigOpen(false);
      setLogsOpen(false);
      
      // Open only the requested section
      switch(section) {
        case 'info':
          setInfoOpen(true);
          break;
        case 'metrics':
          setMetricsOpen(true);
          break;
        case 'logs':
          setLogsOpen(true);
          break;
        case 'loglevels':
          setLogLevelOpen(true);
          break;
        case 'config':
          setConfigOpen(true);
          break;
        default:
          // If invalid section, open all by default
          setInfoOpen(true);
          setMetricsOpen(true);
          setLogLevelOpen(true);
          setConfigOpen(true);
          setLogsOpen(true);
      }
    }
  }, []);
  
  // Set up WebSocket for real-time logs
  const {
    logs: wsLogs,
    isConnected,
    error: wsError,
    clearLogs,
    reconnect
  } = useWebSocketLogs({
    serviceId: service.id,
    enabled: realtimeLogs
  });
  
  const memoryPercentage = service.memory 
    ? (service.memory.used / service.memory.max) * 100
    : 0;
  
  const cpuPercentage = service.cpu 
    ? service.cpu.used * 100 
    : 0;

  // Filter logs based on selected level and search term
  const filteredLogs = useMemo(() => {
    if (!service.logs) return [];
    
    let filtered = service.logs;
    
    // Filter by log level
    if (logLevel !== "ALL") {
      filtered = filtered.filter(log => log.level === logLevel);
    }
    
    // Filter by search term
    if (logSearch.trim()) {
      const searchLower = logSearch.toLowerCase().trim();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchLower) ||
        log.level.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [service.logs, logLevel, logSearch]);

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

      {/* Service Information - Collapsible */}
      <Collapsible open={infoOpen} onOpenChange={setInfoOpen} className="w-full" id="info">
        <Card>
          <CardHeader className="px-6 py-5 flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mr-2 h-8 w-8 p-0 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                  title="Copy link to this section"
                  onClick={() => copySectionLink('info')}
                >
                  <Link className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-medium text-lg text-gray-900 dark:text-white hover:no-underline hover:opacity-80"
                  onClick={() => {
                    // Update URL for deep linking without page reload
                    const newUrl = `/service/${service.id}/info`;
                    window.history.pushState({}, "", newUrl);
                    setLocation(window.location.href);
                  }}
                >
                  <CardTitle className="text-lg leading-6 font-medium">Service Information</CardTitle>
                </Button>
                
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="ml-2 h-8 w-8 p-0">
                    {infoOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                Details and metrics for this Spring Boot service.
              </p>
            </div>
            <div className="flex space-x-2">
              <Button 
                size="sm"
                className="inline-flex items-center text-white bg-primary-600 hover:bg-primary-700"
                onClick={async () => {
                  try {
                    // Show loading state
                    toast({
                      title: "Restarting service...",
                      description: "This may take a few moments.",
                    });
                    
                    // Call the restart function
                    const result = await refreshService();
                    
                    // Show success message
                    toast({
                      title: "Service restarted successfully",
                      description: result?.message || "The service is being restarted. Metrics and logs will refresh shortly.",
                      variant: "default",
                    });
                    
                  } catch (error) {
                    // Show error message
                    toast({
                      title: "Failed to restart service",
                      description: error instanceof Error ? error.message : "An unexpected error occurred",
                      variant: "destructive",
                    });
                  }
                }}
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
          
          <CollapsibleContent>
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
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Metrics Section - Collapsible */}
      <Collapsible open={metricsOpen} onOpenChange={setMetricsOpen} className="w-full" id="metrics">
        <Card>
          <CardHeader className="px-6 py-5">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="mr-2 h-8 w-8 p-0 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                title="Copy link to this section"
                onClick={() => copySectionLink('metrics')}
              >
                <Link className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="link" 
                className="p-0 h-auto font-medium text-lg text-gray-900 dark:text-white hover:no-underline hover:opacity-80"
                onClick={() => {
                  // Update URL for deep linking without page reload
                  const newUrl = `/service/${service.id}/metrics`;
                  window.history.pushState({}, "", newUrl);
                  setLocation(window.location.href);
                }}
              >
                <CardTitle className="text-lg leading-6 font-medium">Resources & Metrics</CardTitle>
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-2 h-8 w-8 p-0">
                  {metricsOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Current resource utilization and metrics.
            </p>
          </CardHeader>
          <CollapsibleContent>
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
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Configuration Management Section - Collapsible */}
      <Collapsible open={configOpen} onOpenChange={setConfigOpen} className="w-full" id="config">
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="mr-2 h-8 w-8 p-0 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                title="Copy link to this section"
                onClick={() => copySectionLink('config')}
              >
                <Link className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="link" 
                className="p-0 h-auto font-medium text-lg text-gray-900 dark:text-white hover:no-underline hover:opacity-80"
                onClick={() => {
                  // Update URL for deep linking without page reload
                  const newUrl = `/service/${service.id}/config`;
                  window.history.pushState({}, "", newUrl);
                  setLocation(window.location.href);
                }}
              >
                <CardTitle className="text-lg">Configuration Management</CardTitle>
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-2 h-8 w-8 p-0">
                  {configOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage configuration properties for this service
            </p>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              {/* Check if we have a valid service ID */}
              {typeof service.id === 'number' ? (
                <ConfigManager serviceId={service.id} />
              ) : (
                <div className="py-4">
                  <div className="animate-pulse flex justify-center">
                    <div className="h-4 w-28 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  </div>
                  <p className="text-sm text-center text-muted-foreground mt-2">Loading configuration data...</p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      
      {/* Log Level Management Section - Collapsible */}
      <Collapsible open={logLevelOpen} onOpenChange={setLogLevelOpen} className="w-full" id="loglevels">
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="mr-2 h-8 w-8 p-0 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                title="Copy link to this section"
                onClick={() => copySectionLink('loglevels')}
              >
                <Link className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="link" 
                className="p-0 h-auto font-medium text-lg text-gray-900 dark:text-white hover:no-underline hover:opacity-80"
                onClick={() => {
                  // Update URL for deep linking without page reload
                  const newUrl = `/service/${service.id}/loglevels`;
                  window.history.pushState({}, "", newUrl);
                  setLocation(window.location.href);
                }}
              >
                <CardTitle className="text-lg">Log Level Management</CardTitle>
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-2 h-8 w-8 p-0">
                  {logLevelOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure logging levels for this service
            </p>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              {/* Check if we have a valid service ID */}
              {typeof service.id === 'number' ? (
                <LogLevelManager serviceId={service.id} />
              ) : (
                <div className="py-4">
                  <div className="animate-pulse flex justify-center">
                    <div className="h-4 w-28 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  </div>
                  <p className="text-sm text-center text-muted-foreground mt-2">Loading logger data...</p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Logs Section - Collapsible */}
      <Collapsible open={logsOpen} onOpenChange={setLogsOpen} className="w-full" id="logs">
        <Card>
          <CardHeader className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mr-2 h-8 w-8 p-0 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                    title="Copy link to this section"
                    onClick={() => copySectionLink('logs')}
                  >
                    <Link className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-medium text-lg text-gray-900 dark:text-white hover:no-underline hover:opacity-80"
                    onClick={() => {
                      // Update URL for deep linking without page reload
                      const newUrl = `/service/${service.id}/logs`;
                      window.history.pushState({}, "", newUrl);
                      setLocation(window.location.href);
                    }}
                  >
                    <CardTitle className="text-lg leading-6 font-medium">Recent Logs</CardTitle>
                  </Button>
                  {realtimeLogs && isConnected && (
                    <Badge variant="default" className="ml-2 animate-pulse">
                      Live
                    </Badge>
                  )}
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="ml-2 h-8 w-8 p-0">
                      {logsOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                  Last log entries from the service.
                  {realtimeLogs && <span className="ml-1">Live streaming enabled.</span>}
                </p>
              </div>

              <div className="flex space-x-2">
                <Button 
                  size="sm"
                  variant={realtimeLogs ? "default" : "outline"}
                  className="inline-flex items-center"
                  onClick={() => {
                    setRealtimeLogs(!realtimeLogs);
                    if (!realtimeLogs) {
                      clearLogs();
                    }
                  }}
                >
                  {realtimeLogs ? (
                    <>
                      <WifiOff className="h-4 w-4 mr-1" />
                      Stop Streaming
                    </>
                  ) : (
                    <>
                      <Wifi className="h-4 w-4 mr-1" />
                      Stream Logs
                    </>
                  )}
                </Button>
                
                <Button 
                  size="sm"
                  variant="outline"
                  className="inline-flex items-center border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  onClick={() => setShowFullscreenLogs(true)}
                >
                  <Maximize2 className="h-4 w-4 mr-1" />
                  Full Screen
                </Button>
              </div>
            </div>
          </CardHeader>

          <CollapsibleContent>
            {/* Search and Filter Controls */}
            <div className="px-6 mb-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search logs..."
                  className="pl-9 w-full"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                />
                {logSearch && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-9 w-9"
                    onClick={() => setLogSearch('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex-shrink-0">
                <Select 
                  value={logLevel}
                  onValueChange={setLogLevel}
                >
                  <SelectTrigger className="w-[130px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Levels</SelectItem>
                    <SelectItem value="ERROR">ERROR</SelectItem>
                    <SelectItem value="WARNING">WARNING</SelectItem>
                    <SelectItem value="INFO">INFO</SelectItem>
                    <SelectItem value="DEBUG">DEBUG</SelectItem>
                    <SelectItem value="TRACE">TRACE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <CardContent className="p-0 border-t border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <LogTable logs={realtimeLogs ? wsLogs : filteredLogs} loading={realtimeLogs && wsLogs.length === 0} />
              </div>
              
              <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button variant="outline" size="sm" disabled>Previous</Button>
                  <Button variant="outline" size="sm" disabled>Next</Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {filteredLogs.length > 0 ? (
                        <>
                          Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredLogs.length}</span> of <span className="font-medium">{filteredLogs.length}</span> logs
                        </>
                      ) : (
                        logSearch ? 
                          <span>No logs matching your search criteria</span> : 
                          <span>No logs available</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Fullscreen Logs Modal */}
      {showFullscreenLogs && (
        <FullscreenLogs
          logs={realtimeLogs ? wsLogs : filteredLogs}
          serviceName={service.name}
          onClose={() => setShowFullscreenLogs(false)}
          isRealtime={realtimeLogs}
          onToggleRealtime={() => {
            setRealtimeLogs(!realtimeLogs);
            if (!realtimeLogs) {
              clearLogs();
            }
          }}
          onClearLogs={clearLogs}
          realtimeStatus={isConnected ? 'connected' : wsError ? 'error' : 'disconnected'}
        />
      )}
    </div>
  );
}
