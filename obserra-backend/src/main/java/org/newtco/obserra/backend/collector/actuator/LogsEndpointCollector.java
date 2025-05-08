package org.newtco.obserra.backend.collector.actuator;

import org.newtco.obserra.backend.model.ActuatorEndpoint;
import org.newtco.obserra.backend.model.Log;
import org.newtco.obserra.backend.model.Service;
import org.newtco.obserra.backend.model.ServiceStatus;
import org.newtco.obserra.backend.storage.Storage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Collector for logs from the Spring Boot actuator logfile endpoint.
 */
@Component
public class LogsEndpointCollector implements ActuatorCollector {

    private static final Logger logger = LoggerFactory.getLogger(LogsEndpointCollector.class);
    private static final String ENDPOINT_TYPE = "logfile";

    // Pattern to match log lines with level, e.g., "2023-04-15 12:34:56.789 INFO [thread] message"
    private static final Pattern LOG_PATTERN = Pattern.compile(
            "^(\\d{4}-\\d{2}-\\d{2}\\s\\d{2}:\\d{2}:\\d{2}\\.\\d{3})\\s+(\\w+)\\s+\\[([^\\]]+)\\]\\s+(.+)$");

    private final Storage storage;
    private final RestTemplate restTemplate;
    private final int logsRecentLimit;

    @Autowired
    public LogsEndpointCollector(
            Storage storage,
            RestTemplateBuilder restTemplateBuilder,
            @Value("${obserra.logs.timeout-ms:5000}") int logsTimeoutMs,
            @Value("${obserra.logs.recent-limit:100}") int logsRecentLimit) {
        this.storage = storage;
        this.logsRecentLimit = logsRecentLimit;

        // Configure RestTemplate with timeout
        this.restTemplate = restTemplateBuilder
                .connectTimeout(Duration.ofMillis(logsTimeoutMs))
                .readTimeout(Duration.ofMillis(logsTimeoutMs))
                .build();
    }

    @Override
    public String getEndpointType() {
        return ENDPOINT_TYPE;
    }

    @Override
    public boolean canHandle(ActuatorEndpoint endpoint) {
        return endpoint != null && ENDPOINT_TYPE.equals(endpoint.getType());
    }

    @Override
    public boolean collectData(Service service, ActuatorEndpoint endpoint) {
        logger.debug("Collecting logs for service: {} ({})", service.getName(), service.getId());

        try {
            String logsUrl = endpoint.getHref();
            ResponseEntity<String> response = restTemplate.getForEntity(logsUrl, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String logContent = response.getBody();
                List<Log> parsedLogs = parseLogs(service.getId(), logContent);

                if (!parsedLogs.isEmpty()) {
                    // Store the logs
                    for (Log log : parsedLogs) {
                        storage.createLog(log);
                    }

                    logger.debug("Stored {} logs for service {}", parsedLogs.size(), service.getName());

                    // Update service status to UP if logs collection succeeded
                    updateServiceStatus(service, ServiceStatus.UP);
                    return true;
                } else {
                    logger.warn("No logs parsed from service {}", service.getName());
                    // Don't update status if we got a response but no logs were parsed
                    // This could be normal for a service that hasn't generated any logs yet
                    return false;
                }
            } else {
                logger.warn("Failed to collect logs from service {}: HTTP {}", 
                        service.getName(), response.getStatusCodeValue());
                // Update service status to DOWN if logs collection failed
                updateServiceStatus(service, ServiceStatus.DOWN);
                return false;
            }
        } catch (RestClientException e) {
            logger.warn("Failed to collect logs from service {}: {}", service.getName(), e.getMessage());
            // Update service status to DOWN if logs collection failed
            updateServiceStatus(service, ServiceStatus.DOWN);
            return false;
        }
    }

    /**
     * Parse logs from a log file content.
     *
     * @param serviceId the ID of the service the logs belong to
     * @param logContent the content of the log file
     * @return a list of parsed logs
     */
    private List<Log> parseLogs(Long serviceId, String logContent) {
        List<Log> logs = new ArrayList<>();

        if (logContent == null || logContent.isEmpty()) {
            return logs;
        }

        // Split the log content into lines
        String[] lines = logContent.split("\n");

        // Process only the most recent lines (up to logsRecentLimit)
        int startIndex = Math.max(0, lines.length - logsRecentLimit);

        for (int i = startIndex; i < lines.length; i++) {
            String line = lines[i];

            if (line.trim().isEmpty()) {
                continue;
            }

            // Try to parse the log line
            Matcher matcher = LOG_PATTERN.matcher(line);

            if (matcher.matches()) {
                // Extract log information
                String timestamp = matcher.group(1);
                String level = matcher.group(2);
                String message = matcher.group(4);

                // Create a log entry
                Log log = new Log();
                log.setServiceId(serviceId);
                log.setLevel(level);
                log.setMessage(message);

                logs.add(log);
            } else {
                // If the line doesn't match the pattern, treat it as INFO level
                Log log = new Log();
                log.setServiceId(serviceId);
                log.setLevel("INFO");
                log.setMessage(line);

                logs.add(log);
            }
        }

        return logs;
    }

    /**
     * Update the status of a service.
     *
     * @param service the service to update
     * @param status the new status
     */
    private void updateServiceStatus(Service service, ServiceStatus status) {
        if (service.getStatus() != status) {
            logger.info("Service {} status changed from {} to {}", 
                    service.getName(), service.getStatus(), status);
        }

        storage.updateServiceStatus(service.getId(), status);
        storage.updateServiceLastSeen(service.getId());
    }
}