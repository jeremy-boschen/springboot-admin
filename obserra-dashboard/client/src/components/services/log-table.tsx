import { LogTableProps } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getLogLevelColor, formatDate, cn } from "@/lib/utils";

export function LogTable({ logs, loading = false }: LogTableProps) {
  if (loading) {
    return <LogTableSkeleton />;
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No logs available for this service.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader className="bg-gray-50 dark:bg-gray-900">
        <TableRow>
          <TableHead className="w-24">Level</TableHead>
          <TableHead className="w-48">Timestamp</TableHead>
          <TableHead>Message</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => {
          // Ensure we have a valid level
          const level = log.level || 'INFO';
          const levelColor = getLogLevelColor(level);

          return (
            <TableRow key={log.id}>
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={cn("px-2 font-semibold", levelColor)}
                >
                  {level}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                {log.timestamp ? formatDate(new Date(log.timestamp)) : 'N/A'}
              </TableCell>
              <TableCell className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                {log.message}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function LogTableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 p-4">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 flex-1" />
      </div>
      <div className="flex items-center gap-4 p-4">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 flex-1" />
      </div>
      <div className="flex items-center gap-4 p-4">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 flex-1" />
      </div>
    </div>
  );
}
