import React, { useState } from 'react';
import { X, Filter, RefreshCw, Moon, Sun, Download, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogTable } from '@/components/services/log-table';
import { getLogLevelColor, cn, formatDate } from '@/lib/utils';
import { Log } from '@shared/schema';

/**
 * Props for the FullscreenLogs component
 * 
 * @property {Log[]} logs - Array of log entries to display
 * @property {string} serviceName - Name of the service being monitored
 * @property {Function} onClose - Callback to close the fullscreen log view
 * @property {boolean} isRealtime - Whether real-time log streaming is active
 * @property {Function} onToggleRealtime - Callback to toggle real-time log streaming
 * @property {Function} onClearLogs - Callback to clear the current log display
 * @property {'connected' | 'disconnected' | 'error'} realtimeStatus - Status of real-time connection
 */
interface FullscreenLogsProps {
  logs: Log[];
  serviceName: string;
  onClose: () => void;
  isRealtime?: boolean;
  onToggleRealtime?: () => void;
  onClearLogs?: () => void;
  realtimeStatus?: 'connected' | 'disconnected' | 'error';
}

export function FullscreenLogs({
  logs,
  serviceName,
  onClose,
  isRealtime = false,
  onToggleRealtime,
  onClearLogs,
  realtimeStatus = 'disconnected'
}: FullscreenLogsProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [logLevel, setLogLevel] = useState('ALL');
  const [logSearch, setLogSearch] = useState('');

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Filter logs based on selected level and search term
  const filteredLogs = React.useMemo(() => {
    let filtered = logs;
    
    // Filter by log level
    if (logLevel !== 'ALL') {
      filtered = filtered.filter(log => log.level === logLevel);
    }
    
    // Filter by search term
    if (logSearch.trim()) {
      const searchLower = logSearch.toLowerCase().trim();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchLower) ||
        (log.level && log.level.toLowerCase().includes(searchLower))
      );
    }
    
    return filtered;
  }, [logs, logLevel, logSearch]);

  // Download logs as text file
  const handleDownloadLogs = () => {
    const logsText = filteredLogs.map(log => {
      const timestamp = log.timestamp ? formatDate(new Date(log.timestamp)) : 'N/A';
      const level = log.level || 'INFO';
      return `[${timestamp}] ${level}: ${log.message}`;
    }).join('\n');
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${serviceName}-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <div className={`px-6 py-4 flex items-center justify-between border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold">Logs: {serviceName}</h2>
          {isRealtime && (
            <Badge variant={realtimeStatus === 'connected' ? 'default' : 'destructive'} className="animate-pulse">
              {realtimeStatus === 'connected' ? 'Live' : 'Disconnected'}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleTheme}
            className={theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleRealtime}
            className={cn(
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200',
              isRealtime ? 'bg-primary-600 text-white' : ''
            )}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRealtime && "animate-spin")} />
            {isRealtime ? 'Streaming' : 'Start Streaming'}
          </Button>
          {onClearLogs && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearLogs}
              className={theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
            >
              Clear Logs
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadLogs}
            className={theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className={theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={`px-6 py-3 flex flex-col sm:flex-row gap-3 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="relative flex-grow">
          <Search className={`absolute left-2.5 top-2.5 h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
          <Input
            type="text"
            placeholder="Search logs..."
            className={cn(
              "pl-9 w-full",
              theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
            )}
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
          />
          {logSearch && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-9 w-9"
              onClick={() => setLogSearch('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex-shrink-0">
          <Select 
            value={logLevel}
            onValueChange={setLogLevel}
          >
            <SelectTrigger className={cn(
              "w-[130px]",
              theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
            )}>
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Levels</SelectItem>
              <SelectItem value="ERROR">ERROR</SelectItem>
              <SelectItem value="WARNING">WARNING</SelectItem>
              <SelectItem value="INFO">INFO</SelectItem>
              <SelectItem value="DEBUG">DEBUG</SelectItem>
              <SelectItem value="TRACE">TRACE</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Log Content */}
      <div className="flex-1 overflow-auto">
        <div className="min-h-full">
          <LogTable logs={filteredLogs} />
        </div>
      </div>

      {/* Footer with stats */}
      <div className={`px-6 py-3 border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex justify-between items-center">
          <div className="text-sm">
            Showing {filteredLogs.length} of {logs.length} log entries
          </div>
          <div className="flex space-x-3">
            {['ERROR', 'WARNING', 'INFO', 'DEBUG', 'TRACE'].map(level => {
              const count = logs.filter(log => log.level === level).length;
              if (count === 0) return null;

              const levelColor = getLogLevelColor(level);
              return (
                <div key={level} className="flex items-center text-sm">
                  <Badge 
                    variant="outline" 
                    className={cn("px-2 font-semibold mr-1", levelColor)}
                  >
                    {level}
                  </Badge>
                  <span>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}