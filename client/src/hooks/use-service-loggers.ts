import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface Logger {
  configuredLevel: string | null;
  effectiveLevel: string;
}

interface LoggersResponse {
  levels: string[];
  loggers: {
    [key: string]: Logger;
  };
}

interface SetLogLevelParams {
  logger: string;
  level: string;
}

export function useServiceLoggers(serviceId: number | string | null) {
  const [selectedLogger, setSelectedLogger] = useState<string | null>(null);
  
  // Fetch loggers
  const { 
    data: loggersData, 
    isLoading: isLoadingLoggers, 
    error: loggersError,
    refetch: refetchLoggers
  } = useQuery({
    queryKey: ['/api/services', serviceId, 'loggers'],
    queryFn: async () => {
      if (!serviceId) return null;
      
      // Directly use fetch for better type control
      const response = await fetch(`/api/services/${serviceId}/loggers`);
      if (!response.ok) {
        throw new Error('Failed to fetch loggers data');
      }
      
      // Get the response data and cast it to expected type
      const data = await response.json();
      return data as LoggersResponse;
    },
    enabled: !!serviceId,
    staleTime: 30000,
  });

  // Set log level mutation
  const { 
    mutate: setLogLevel, 
    isPending: isSettingLogLevel,
  } = useMutation({
    mutationFn: async (params: SetLogLevelParams) => {
      if (!serviceId) throw new Error('Service ID is required');
      
      // Use the apiRequest function with the new signature
      return apiRequest({
        url: `/api/services/${serviceId}/loggers/${encodeURIComponent(params.logger)}`,
        method: 'POST',
        body: { level: params.level }
      });
    },
    onSuccess: () => {
      // Refetch loggers to update the UI with new log levels
      refetchLoggers();
    },
  });

  // Extract available log levels with fallback
  const logLevels = loggersData?.levels || ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];
  
  // Get list of loggers with their current levels
  const loggers = loggersData?.loggers || {};
  
  // Create array of logger entries for easier rendering in UI
  const loggersList = Object.entries(loggers).map(([name, config]) => {
    // Ensure we have valid type information by casting
    const typedConfig = config as Logger;
    return {
      name,
      configuredLevel: typedConfig.configuredLevel,
      effectiveLevel: typedConfig.effectiveLevel
    };
  });
  
  return {
    loggersList,
    logLevels,
    selectedLogger,
    setSelectedLogger,
    setLogLevel,
    isLoadingLoggers,
    isSettingLogLevel,
    loggersError,
    refetchLoggers,
  };
}