import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface LogLevelManagerProps {
  serviceId: number;
}

export function LogLevelManager({ serviceId }: LogLevelManagerProps) {
  const {
    loggersList,
    logLevels,
    selectedLogger,
    setSelectedLogger,
    setLogLevel,
    isLoadingLoggers,
    isSettingLogLevel,
    loggersError,
    refetchLoggers,
  } = useServiceLoggers(serviceId);

  const [logLevelToSet, setLogLevelToSet] = React.useState('');

  // Handle when a logger is selected
  const handleLoggerSelect = (name: string) => {
    setSelectedLogger(name);
    
    // Find the current level of the selected logger
    const logger = loggersList.find(l => l.name === name);
    setLogLevelToSet(logger?.configuredLevel || logger?.effectiveLevel || 'INFO');
  };

  // Handle log level change
  const handleSetLogLevel = () => {
    if (selectedLogger && logLevelToSet) {
      setLogLevel({ logger: selectedLogger, level: logLevelToSet });
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
                Manage logger levels to control verbosity of log outputs.
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
                        <TableRow 
                          key={logger.name}
                          className={`cursor-pointer ${selectedLogger === logger.name ? 'bg-muted/50' : ''}`}
                          onClick={() => handleLoggerSelect(logger.name)}
                        >
                          <TableCell className="font-mono text-xs">
                            {logger.name === 'ROOT' ? (
                              <span className="font-bold">ROOT</span>
                            ) : (
                              logger.name
                            )}
                          </TableCell>
                          <TableCell>
                            {logger.configuredLevel ? (
                              <Badge variant="outline" className={getLogLevelColor(logger.configuredLevel)}>
                                {logger.configuredLevel}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">Not configured</span>
                            )}
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
              
              {selectedLogger && (
                <div className="p-4 border border-border rounded-md bg-background">
                  <h4 className="font-medium mb-2">Change Log Level</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Selected Logger: <code className="bg-muted px-1 py-0.5 rounded">{selectedLogger}</code>
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <Select
                      value={logLevelToSet}
                      onValueChange={setLogLevelToSet}
                      disabled={isSettingLogLevel}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Select level" />
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
                    
                    <Button 
                      onClick={handleSetLogLevel} 
                      disabled={isSettingLogLevel || !logLevelToSet}
                    >
                      {isSettingLogLevel ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Applying
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" /> Apply
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}