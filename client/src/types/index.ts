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
