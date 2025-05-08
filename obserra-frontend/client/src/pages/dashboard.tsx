import { useState } from "react";
import { useK8sServices } from "@/hooks/use-k8s-services";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { ServiceCard } from "@/components/services/service-card";
import { ServiceDetail } from "@/components/services/service-detail";
import { useServiceDetails } from "@/hooks/use-service-details";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterIcon } from "lucide-react";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [namespace, setNamespace] = useState("all");

  const { 
    services, 
    isLoading: isLoadingServices, 
    refreshServices,
    isError 
  } = useK8sServices();

  const {
    service: activeService,
    isLoading: isLoadingServiceDetails,
    refreshService
  } = useServiceDetails(activeServiceId);

  const filteredServices = namespace === "all" 
    ? services 
    : services.filter(service => service.namespace === namespace);

  const namespaces = [...new Set(services.map(s => s.namespace))];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleRefresh = async () => {
    await refreshServices();
    setLastRefreshed(new Date());
  };

  const handleServiceClick = (serviceId: string) => {
    setActiveServiceId(serviceId);
  };

  return (
    <div className="min-h-screen antialiased bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
      <Navbar 
        toggleSidebar={toggleSidebar} 
        lastRefreshed={lastRefreshed}
        onRefresh={handleRefresh}
        isRefreshing={isLoadingServices}
      />

      <Sidebar 
        services={services} 
        activeServiceId={activeServiceId}
        setActiveServiceId={setActiveServiceId}
        sidebarOpen={sidebarOpen}
      />

      <main className={`pt-16 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {!activeServiceId && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Service Overview
                </h1>
                <div className="flex space-x-2">
                  <Select 
                    defaultValue="all" 
                    onValueChange={setNamespace}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Namespaces" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Namespaces</SelectItem>
                      {namespaces.map(ns => (
                        <SelectItem key={ns} value={ns}>{ns}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="bg-primary-50 text-primary-600 dark:bg-gray-700 dark:text-primary-400">
                    <FilterIcon className="h-4 w-4 mr-2" />
                    Add Filter
                  </Button>
                </div>
              </div>

              {isError && (
                <div className="bg-error-100 dark:bg-error-900 dark:bg-opacity-30 text-error-800 dark:text-error-400 p-4 rounded-md">
                  Error loading services. Please check your Kubernetes connection.
                </div>
              )}

              {isLoadingServices ? (
                <ServiceCardSkeleton />
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredServices.map((service) => (
                    <ServiceCard 
                      key={service.id}
                      service={service}
                      onClick={() => handleServiceClick(service.id.toString())}
                    />
                  ))}
                  {filteredServices.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500 dark:text-gray-400">
                      No services found. Make sure your Spring Boot applications have the correct labels or annotations.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeServiceId && activeService && (
            <ServiceDetail 
              service={activeService}
              onBack={() => setActiveServiceId(null)}
              refreshService={refreshService}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function ServiceCardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array(4).fill(0).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-4 w-24 mb-4" />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-4 w-28 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}
