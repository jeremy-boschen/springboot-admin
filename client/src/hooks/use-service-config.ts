import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfigProperty, InsertConfigProperty } from "@shared/schema";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

/**
 * Hook to manage configuration properties for a service
 */
export function useServiceConfig(serviceId: number | string | null) {
  const queryClient = useQueryClient();
  
  const serviceIdStr = serviceId ? String(serviceId) : '';
  const configQueryKey = serviceId ? [`/api/services/${serviceIdStr}/config`] : undefined;
  
  // Fetch all configuration properties for a service
  const {
    data: configProperties = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: configQueryKey,
    queryFn: getQueryFn<ConfigProperty[]>({ on401: "returnNull" }),
    enabled: !!serviceIdStr
  });
  
  // Create a new configuration property
  const createMutation = useMutation({
    mutationFn: async (newProperty: Omit<InsertConfigProperty, "serviceId">) => {
      if (!serviceIdStr) {
        throw new Error("No service selected");
      }
      
      return apiRequest<ConfigProperty>({
        url: `/api/services/${serviceIdStr}/config`,
        method: "POST",
        body: { 
          ...newProperty,
          serviceId: Number(serviceIdStr)
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configQueryKey });
      toast({
        title: "Success",
        description: "Configuration property created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating config property:", error);
      toast({
        title: "Error",
        description: "Failed to create configuration property",
        variant: "destructive",
      });
    },
  });
  
  // Update an existing configuration property
  const updateMutation = useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: number; 
      data: Partial<Omit<InsertConfigProperty, "serviceId">> 
    }) => {
      if (!serviceIdStr) {
        throw new Error("No service selected");
      }
      
      return apiRequest<ConfigProperty>({
        url: `/api/services/${serviceIdStr}/config/${id}`,
        method: "PUT",
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configQueryKey });
      toast({
        title: "Success",
        description: "Configuration property updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating config property:", error);
      toast({
        title: "Error",
        description: "Failed to update configuration property",
        variant: "destructive",
      });
    },
  });
  
  // Delete a configuration property
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!serviceIdStr) {
        throw new Error("No service selected");
      }
      
      // For DELETE requests that return 204 No Content
      const response = await fetch(`/api/services/${serviceIdStr}/config/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || response.statusText);
      }
      
      // Return success flag since the endpoint returns no content
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configQueryKey });
      toast({
        title: "Success",
        description: "Configuration property deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting config property:", error);
      toast({
        title: "Error",
        description: "Failed to delete configuration property",
        variant: "destructive",
      });
    },
  });
  
  return {
    configProperties,
    isLoading,
    error,
    refetch,
    createProperty: createMutation.mutate,
    updateProperty: updateMutation.mutate,
    deleteProperty: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}