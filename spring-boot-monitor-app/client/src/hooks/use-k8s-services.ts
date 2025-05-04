import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ServiceDetail } from "@shared/schema";

export function useK8sServices() {
  const queryClient = useQueryClient();

  const servicesQuery = useQuery<ServiceDetail[]>({ 
    queryKey: ['/api/services'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const refreshServices = async () => {
    await queryClient.invalidateQueries({ queryKey: ['/api/services'] });
  };

  const restartServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      await fetch(`/api/services/${serviceId}/restart`, { 
        method: 'POST',
        credentials: 'include'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
    }
  });

  return {
    services: servicesQuery.data || [],
    isLoading: servicesQuery.isLoading,
    isError: servicesQuery.isError,
    error: servicesQuery.error,
    refreshServices,
    restartService: restartServiceMutation.mutate
  };
}
