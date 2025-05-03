import { useQuery } from "@tanstack/react-query";
import { ServiceDetail, Log } from "@shared/schema";

export function useServiceDetails(serviceId: string | null) {
  const serviceQuery = useQuery<ServiceDetail>({
    queryKey: ['/api/services', serviceId],
    enabled: !!serviceId,
    refetchInterval: 10000, // Refresh every 10 seconds
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

  const service = serviceQuery.data ? {
    ...serviceQuery.data,
    logs: logsQuery.data || [],
    memory: metricsQuery.data?.memory,
    cpu: metricsQuery.data?.cpu,
    errors: metricsQuery.data?.errors
  } : null;

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
