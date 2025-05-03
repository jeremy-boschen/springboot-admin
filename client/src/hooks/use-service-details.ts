import { useQuery } from "@tanstack/react-query";
import { ServiceDetail, Log } from "@shared/schema";

export function useServiceDetails(serviceId: string | null) {
  // Add debug info to understand what's happening
  console.log('useServiceDetails called with serviceId:', serviceId, typeof serviceId);
  
  const serviceQuery = useQuery<ServiceDetail>({
    queryKey: ['/api/services', serviceId],
    enabled: !!serviceId,
    refetchInterval: 10000, // Refresh every 10 seconds
    // Add custom fetcher to ensure we're getting the data properly
    queryFn: async () => {
      if (!serviceId) throw new Error('Service ID is required');
      
      const response = await fetch(`/api/services/${serviceId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch service details');
      }
      
      const data = await response.json();
      console.log('Service API response:', data);
      return data as ServiceDetail;
    }
  });

  const logsQuery = useQuery<Log[]>({
    queryKey: ['/api/services', serviceId, 'logs'],
    enabled: !!serviceId,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const metricsQuery = useQuery<{
    memory: { used: number; max: number; trend: number[] };
    cpu: { used: number; max: number; trend: number[] };
    errors: { count: number; trend: number[] };
  }>({
    queryKey: ['/api/services', serviceId, 'metrics'],
    enabled: !!serviceId,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const isLoading = serviceQuery.isLoading || logsQuery.isLoading || metricsQuery.isLoading;
  const isError = serviceQuery.isError || logsQuery.isError || metricsQuery.isError;
  const error = serviceQuery.error || logsQuery.error || metricsQuery.error;

  // Make sure we have a valid service object with all necessary data
  const service = serviceQuery.data ? {
    ...serviceQuery.data,
    // Make sure ID is a number
    id: typeof serviceQuery.data.id === 'number' ? serviceQuery.data.id : 
        typeof serviceQuery.data.id === 'string' ? parseInt(serviceQuery.data.id, 10) : null,
    logs: logsQuery.data || [],
    memory: metricsQuery.data?.memory,
    cpu: metricsQuery.data?.cpu,
    errors: metricsQuery.data?.errors
  } : null;
  
  console.log('Processed service data:', service);

  return {
    service,
    isLoading,
    isError,
    error,
    refreshService: () => {
      serviceQuery.refetch();
      logsQuery.refetch();
      metricsQuery.refetch();
    }
  };
}
