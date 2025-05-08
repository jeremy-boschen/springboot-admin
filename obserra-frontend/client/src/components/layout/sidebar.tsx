import { useState, useEffect } from "react";
import { cn, getStatusColor } from "@/lib/utils";
import { SidebarProps } from "@/types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function Sidebar({ services, activeServiceId, setActiveServiceId, sidebarOpen }: SidebarProps) {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Stats for the summary at the bottom
  const totalServices = services.length;
  const upServices = services.filter(service => service.status === "UP").length;
  const warningServices = services.filter(service => service.status === "WARNING").length;
  const downServices = services.filter(service => service.status === "DOWN").length;

  return (
    <div 
      className={cn(
        "fixed inset-y-0 left-0 pt-16 w-64 bg-white dark:bg-gray-800 shadow-md transition-transform duration-300 transform z-[5]",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="h-full flex flex-col overflow-y-auto">
        <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Services</h2>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Auto-refresh</span>
              <Switch
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {services.map((service) => {
            const statusColor = getStatusColor(service.status);
            
            return (
              <button
                key={service.id}
                onClick={() => setActiveServiceId(service.id.toString())}
                className={cn(
                  "flex items-center w-full px-2 py-2 text-base font-medium rounded-md transition-colors",
                  activeServiceId === service.id.toString()
                    ? "bg-primary-50 text-primary-600 dark:bg-gray-700 dark:text-primary-400"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                )}
              >
                <span className={cn("inline-block w-2.5 h-2.5 rounded-full mr-2", statusColor.bg)}></span>
                <span>{service.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <div>Total: <span className="font-medium text-gray-700 dark:text-gray-300">{totalServices} Services</span></div>
              <div className="mt-1">
                <span className="inline-flex items-center text-success-600 dark:text-success-500">
                  <span className="inline-block w-2.5 h-2.5 rounded-full mr-2 bg-success-500"></span>{upServices} UP
                </span>
                <span className="ml-2 inline-flex items-center text-warning-600 dark:text-warning-500">
                  <span className="inline-block w-2.5 h-2.5 rounded-full mr-2 bg-warning-500"></span>{warningServices} WARNING
                </span>
                <span className="ml-2 inline-flex items-center text-error-600 dark:text-error-500">
                  <span className="inline-block w-2.5 h-2.5 rounded-full mr-2 bg-error-500"></span>{downServices} DOWN
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
