import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useServiceDetails } from "@/hooks/use-service-details";
import { ServiceDetail } from "@/components/services/service-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

/**
 * Service Detail Page Component
 * 
 * This component renders a detailed view of a specific Spring Boot service identified by its ID.
 * It serves as the main page for viewing all aspects of a service's health, metrics, logs, and configuration.
 * 
 * Features:
 * - Fetches comprehensive service details, metrics, and logs from the API
 * - Displays service information in collapsible sections for better organization
 * - Supports dynamic opening/closing of specific content sections 
 * - Provides navigation back to the dashboard
 * 
 * Deep Linking Support:
 * The component supports URL-based deep linking to specific sections for easy sharing:
 * - /service/:id - Shows all sections (default collapsed state)
 * - /service/:id/:section - Shows and highlights the specified section
 *   (section can be: info, metrics, logs, loglevels, config)
 * 
 * When a deep link is accessed, the relevant section is automatically expanded and
 * scrolled into view for better user experience.
 */
export default function ServicePage() {
  const [, setLocation] = useLocation();
  // Get the service ID and optional section from URL parameters
  const { id, section } = useParams<{ id: string, section?: string }>();
  const { toast } = useToast();
  
  const { 
    service, 
    isLoading, 
    isError, 
    error, 
    refreshService 
  } = useServiceDetails(id);
  
  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading service",
        description: error?.message || "Could not load service details. Please try again.",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);
  
  // Determine which section to open based on URL parameter
  const initialSections = {
    info: section === 'info',
    metrics: section === 'metrics',
    config: section === 'config',
    loglevels: section === 'loglevels',
    logs: section === 'logs' || !section, // Default to logs open if no section specified
  };

  if (isLoading) {
    return <ServiceDetailSkeleton />;
  }

  if (!service) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="mr-3 p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Service Not Found</h1>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <p className="text-gray-600 dark:text-gray-300">
            The service with ID {id} could not be found. It may have been removed or is unavailable.
          </p>
          <Button className="mt-4" onClick={() => setLocation("/")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <ServiceDetail 
        service={service} 
        onBack={() => setLocation("/")}
        refreshService={refreshService}
        initialSections={initialSections}
      />
    </div>
  );
}

function ServiceDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center">
        <Skeleton className="h-10 w-10 mr-3 rounded-full" />
        <Skeleton className="h-8 w-64" />
      </div>
      
      <Skeleton className="h-64 w-full rounded-lg" />
      
      <Skeleton className="h-96 w-full rounded-lg" />
      
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  );
}
