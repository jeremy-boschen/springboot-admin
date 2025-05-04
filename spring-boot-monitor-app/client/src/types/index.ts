import { ServiceDetail, Service, ServiceStatus, Log, Metric } from "@shared/schema";

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
  storageKey?: string;
}

export interface SidebarProps {
  services: ServiceDetail[];
  activeServiceId?: string | null;
  setActiveServiceId: (id: string | null) => void;
  sidebarOpen: boolean;
}

export interface ServiceCardProps {
  service: ServiceDetail;
  onClick: () => void;
}

/**
 * ServiceDetailProps - Properties for the ServiceDetail component
 * 
 * @property {ServiceDetail} service - The service object containing all details to display
 * @property {Function} onBack - Callback function to navigate back to the service list
 * @property {Function} refreshService - Function to trigger a refresh of the service data
 * @property {Object} initialSections - Optional configuration for which sections should be initially expanded
 *   This is primarily used for deep linking to specific sections of the service detail view
 */
export interface ServiceDetailProps {
  service: ServiceDetail;
  onBack: () => void;
  refreshService: () => void;
  initialSections?: {
    info?: boolean;
    metrics?: boolean;
    loglevels?: boolean;
    config?: boolean;
    logs?: boolean;
  };
}

export interface MetricsChartProps {
  data: number[];
  height?: number;
  colorThresholds?: {
    warning: number;
    error: number;
  };
}

export interface LogTableProps {
  logs: Log[];
  loading?: boolean;
}
