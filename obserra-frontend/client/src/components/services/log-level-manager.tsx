import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle, Check } from 'lucide-react';
import { useServiceLoggers } from '@/hooks/use-service-loggers';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getLogLevelColor } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LogLevelManagerProps {
  serviceId: number | string;
}

export function LogLevelManager({ serviceId }: LogLevelManagerProps) {
  // Add debug logs to see what's happening
  console.log("LogLevelManager rendered with serviceId:", serviceId, typeof serviceId);
  
  const {
    loggersList,
    logLevels,
    setLogLevel,
    isLoadingLoggers,
    isSettingLogLevel,
    loggersError,
    refetchLoggers,
  } = useServiceLoggers(serviceId);

  console.log("useServiceLoggers hook returned:", { 
    loggersList, 
    loggersCount: loggersList?.length,
    loggersError
  });
  
  // Handle log level change
  const handleSetLogLevel = (loggerName: string, newLevel: string) => {
    // Get the logger
    const logger = loggersList.find(l => l.name === loggerName);
    
    // Only update if the level is different
    if (logger && logger.configuredLevel !== newLevel) {
      setLogLevel({ 
        logger: loggerName, 
        level: newLevel 
      });
    }
  };

  if (loggersError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Log Level Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3">
            <AlertCircle className="h-5 w-5 text-destructive mr-3" />
            <div className="text-sm text-destructive">
              Failed to load logger information. This service may not support log level management.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Log Level Management</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetchLoggers()}
          disabled={isLoadingLoggers}
        >
          {isLoadingLoggers ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading
            </>
          ) : (
            'Refresh'
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoadingLoggers ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                Click on a logger level to change it.
              </p>
              
              <div className="border border-border rounded-md mb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/3">Logger</TableHead>
                      <TableHead className="w-1/3">Configured Level</TableHead>
                      <TableHead className="w-1/3">Effective Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loggersList.length > 0 ? (
                      loggersList.map((logger) => (
                        <TableRow key={logger.name}>
                          <TableCell className="font-mono text-xs">
                            {logger.name === 'ROOT' ? (
                              <span className="font-bold">ROOT</span>
                            ) : (
                              logger.name
                            )}
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="inline-block">
                                    <Select
                                      value={logger.configuredLevel || logger.effectiveLevel}
                                      onValueChange={(newLevel) => handleSetLogLevel(logger.name, newLevel)}
                                      disabled={isSettingLogLevel}
                                    >
                                      <SelectTrigger className="h-7 px-2 py-0 border-none bg-transparent hover:bg-muted">
                                        <SelectValue placeholder="Select level">
                                          {logger.configuredLevel ? (
                                            <Badge variant="outline" className={getLogLevelColor(logger.configuredLevel)}>
                                              {logger.configuredLevel}
                                            </Badge>
                                          ) : (
                                            <span className="text-muted-foreground text-xs">Not configured</span>
                                          )}
                                        </SelectValue>
                                      </SelectTrigger>
                                      <SelectContent>
                                        {logLevels.map((level: string) => (
                                          <SelectItem key={level} value={level}>
                                            <Badge variant="outline" className={getLogLevelColor(level || 'INFO')}>
                                              {level}
                                            </Badge>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Click to change level</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getLogLevelColor(logger.effectiveLevel)}>
                              {logger.effectiveLevel}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                          No loggers available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {isSettingLogLevel && (
                <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
                  Updating log level...
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}