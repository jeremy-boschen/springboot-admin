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

export function useServiceLoggers(serviceId: number | null) {
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
      return await apiRequest<LoggersResponse>(`/api/services/${serviceId}/loggers`);
    },
    enabled: !!serviceId,
    staleTime: 30000,
  });

  // Set log level mutation
  const { 
    mutate: setLogLevel, 
    isPending: isSettingLogLevel,
  } = useMutation({
    mutationFn: async ({ 
      logger, 
      level 
    }: { 
      logger: string; 
      level: string;
    }) => {
      if (!serviceId) throw new Error('Service ID is required');
      return await apiRequest(
        `/api/services/${serviceId}/loggers/${encodeURIComponent(logger)}`,
        { method: 'POST', body: JSON.stringify({ level }) }
      );
    },
    onSuccess: () => {
      // Refetch loggers to update the UI with new log levels
      refetchLoggers();
    },
  });

  // Extract available log levels
  const logLevels = loggersData?.levels || ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];
  
  // Get list of loggers with their current levels
  const loggers = loggersData?.loggers || {};
  
  // Create array of logger entries for easier rendering in UI
  const loggersList = Object.entries(loggers).map(([name, config]) => ({
    name,
    configuredLevel: config.configuredLevel,
    effectiveLevel: config.effectiveLevel
  }));
  
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