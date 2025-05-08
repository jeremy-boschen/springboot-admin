import { cn, getResourceUtilizationClass } from "@/lib/utils";
import { MetricsChartProps } from "@/types";

export function MetricsChart({ 
  data, 
  height = 64,
  colorThresholds = { warning: 70, error: 90 }
}: MetricsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div 
        className="bg-gray-100 dark:bg-gray-700 rounded flex items-end"
        style={{ height: `${height}px` }}
      >
        <div className="w-full text-center text-gray-500 dark:text-gray-400 text-xs">
          No data
        </div>
      </div>
    );
  }

  const getColorClass = (value: number) => {
    if (value < colorThresholds.warning) {
      return "bg-success-500";
    } else if (value < colorThresholds.error) {
      return "bg-warning-500";
    } else {
      return "bg-error-500";
    }
  };

  return (
    <div 
      className="bg-gray-100 dark:bg-gray-700 rounded flex items-end"
      style={{ height: `${height}px` }}
    >
      {data.map((value, index) => (
        <div 
          key={index}
          className={cn("flex-1 mx-px", getColorClass(value))}
          style={{ height: `${value}%` }}
        />
      ))}
    </div>
  );
}
