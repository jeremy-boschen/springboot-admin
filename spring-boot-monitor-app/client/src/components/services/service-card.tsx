import { ServiceCardProps } from "@/types";
import { getStatusColor, getResourceUtilizationClass } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ServiceCard({ service, onClick }: ServiceCardProps) {
  const statusColor = getStatusColor(service.status);
  
  const memoryPercentage = service.memory 
    ? (service.memory.used / service.memory.max) * 100
    : 0;
  
  const cpuPercentage = service.cpu 
    ? service.cpu.used * 100 
    : 0;
  
  return (
    <Card 
      className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className={cn("inline-block w-2.5 h-2.5 rounded-full mr-2", statusColor.bg)}></span>
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">{service.name}</h3>
          </div>
          <Badge variant="outline" className={cn(
            "px-2.5 py-0.5 rounded-full text-xs font-medium",
            statusColor.bgLight, statusColor.textLight, statusColor.bgDark, statusColor.textDark
          )}>
            {service.status}
          </Badge>
        </div>

        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          v{service.version} • {service.namespace}
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Memory</div>
            <div className="flex items-end mt-1">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {service.memory ? (
                  <>{service.memory.used}/{service.memory.max} MB</>
                ) : (
                  <>-- / -- MB</>
                )}
              </div>
              <div className="ml-2 h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full", getResourceUtilizationClass(memoryPercentage))}
                  style={{ width: `${memoryPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">CPU</div>
            <div className="flex items-end mt-1">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {service.cpu ? (
                  <>{cpuPercentage.toFixed(0)}%</>
                ) : (
                  <>--%</>
                )}
              </div>
              <div className="ml-2 h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full", getResourceUtilizationClass(cpuPercentage))}
                  style={{ width: `${cpuPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">Uptime</div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {service.lastUpdated ? formatUptime(new Date(service.lastUpdated)) : "--"}
          </div>
        </div>
        
        <div className="mt-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">Errors (last 24h)</div>
          <div className="mt-1 flex">
            <div className={cn(
              "text-sm font-medium",
              !service.errors?.count 
                ? "text-success-600 dark:text-success-500"
                : service.errors.count < 5
                  ? "text-warning-600 dark:text-warning-500"
                  : "text-error-600 dark:text-error-500"
            )}>
              {service.errors?.count ?? 0}
            </div>
            {service.errors?.trend && (
              <div className="flex-1 ml-2">
                <div className="flex items-end h-10 w-full">
                  {service.errors.trend.map((value, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex-1 mx-px", 
                        value === 0 
                          ? "bg-success-500 dark:bg-success-600"
                          : value < 2 
                            ? "bg-warning-500 dark:bg-warning-600"
                            : "bg-error-500 dark:bg-error-600"
                      )}
                      style={{ height: `${value === 0 ? 5 : (value * 20)}%` }}
                    ></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatUptime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const days = Math.floor(diffInSeconds / 86400);
  const hours = Math.floor((diffInSeconds % 86400) / 3600);
  const minutes = Math.floor((diffInSeconds % 3600) / 60);
  
  let result = '';
  if (days > 0) result += `${days}d `;
  if (hours > 0 || days > 0) result += `${hours}h `;
  result += `${minutes}m`;
  
  return result;
}
