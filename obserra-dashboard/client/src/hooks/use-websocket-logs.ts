import { useState, useEffect, useRef, useCallback } from 'react';
import { Log } from '@shared/schema';

/**
 * WebSocketLogsOptions - Configuration options for the WebSocket logs hook
 * @property {number|string|null} serviceId - The ID of the service to stream logs from
 * @property {boolean} enabled - Whether the WebSocket connection should be enabled
 */
interface WebSocketLogsOptions {
  serviceId: number | string | null;
  enabled?: boolean;
}

/**
 * Custom hook for real-time log streaming via WebSockets
 * 
 * This hook establishes and manages a WebSocket connection to the server for 
 * receiving real-time log updates from a specific service. It handles:
 * 
 * - Establishing WebSocket connections with proper protocol detection
 * - Maintaining connection state and reconnection logic
 * - Aggregating incoming log messages into a unified state
 * - Providing connection status for UI feedback
 * - Cleaning up connections when no longer needed
 * 
 * @param options Configuration options for the WebSocket connection
 * @returns Object containing logs array, connection status, error state, and utility functions
 */
export function useWebSocketLogs({ serviceId, enabled = true }: WebSocketLogsOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  
  // Clear logs function
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  useEffect(() => {
    // Don't connect if not enabled or no serviceId
    if (!enabled || !serviceId) {
      return;
    }

    // Setup WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    // Connection opened
    socket.addEventListener('open', () => {
      setIsConnected(true);
      setError(null);
      console.log('WebSocket connected for log streaming');

      // Subscribe to logs for the service
      socket.send(JSON.stringify({
        type: 'subscribe',
        serviceId: serviceId
      }));
    });

    // Listen for log messages
    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'logs' && data.serviceId == serviceId) {
          // Add new logs to the existing ones (avoiding duplicates by ID)
          setLogs(prevLogs => {
            const existingIds = new Set(prevLogs.map(log => log.id));
            const newLogs = data.logs.filter((log: Log) => !existingIds.has(log.id));
            
            if (newLogs.length === 0) {
              return prevLogs;
            }
            
            // Limit to last 1000 logs to prevent memory issues
            return [...newLogs, ...prevLogs].slice(0, 1000);
          });
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    });

    // Listen for errors
    socket.addEventListener('error', (event) => {
      console.error('WebSocket error:', event);
      setError(new Error('WebSocket error occurred'));
      setIsConnected(false);
    });

    // Connection closed
    socket.addEventListener('close', () => {
      setIsConnected(false);
      console.log('WebSocket connection closed');
    });

    // Clean up on unmount
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        // Unsubscribe before closing
        socket.send(JSON.stringify({
          type: 'unsubscribe',
          serviceId: serviceId
        }));
        socket.close();
      }
      socketRef.current = null;
    };
  }, [serviceId, enabled]);

  // Function to manually reconnect
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    // Effect will re-run and establish a new connection
    setIsConnected(false);
  }, []);

  return {
    logs,
    isConnected,
    error,
    clearLogs,
    reconnect
  };
}