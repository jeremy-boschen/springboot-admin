package org.newtco.obserra.backend.collector.actuator;

import org.newtco.obserra.backend.collector.Collector;

/**
 * Interface for collecting data from a specific type of actuator endpoint.
 * Implementations of this interface will handle different types of endpoints (metrics, logs, etc.)
 */
public interface ActuatorCollector extends Collector {

    /**
     * Get the type of endpoint this collector handles
     *
     * @return The endpoint type (e.g., "metrics", "health", "logfile")
     */
    String getName();

    default boolean canCollect(ActuatorEndpoint endpoint) {
        return endpoint.getType().equals(getName());
    }
}