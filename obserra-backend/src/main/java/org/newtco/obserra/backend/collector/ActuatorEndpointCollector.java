package org.newtco.obserra.backend.collector;

import org.newtco.obserra.backend.model.ActuatorEndpoint;
import org.newtco.obserra.backend.model.Service;

/**
 * Interface for collecting data from a specific type of actuator endpoint.
 * Implementations of this interface will handle different types of endpoints (metrics, logs, etc.)
 */
public interface ActuatorEndpointCollector {

    /**
     * Get the type of endpoint this collector handles
     * 
     * @return The endpoint type (e.g., "metrics", "health", "logfile")
     */
    String getEndpointType();

    /**
     * Check if this collector can handle the given endpoint
     * 
     * @param endpoint The actuator endpoint to check
     * @return true if this collector can handle the endpoint, false otherwise
     */
    boolean canHandle(ActuatorEndpoint endpoint);

    /**
     * Collect data from the endpoint for the given service
     * 
     * @param service The service to collect data for
     * @param endpoint The actuator endpoint to collect data from
     * @return true if data was collected successfully, false otherwise
     */
    boolean collectData(Service service, ActuatorEndpoint endpoint);
}