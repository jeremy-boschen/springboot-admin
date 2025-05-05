package org.newtco.obserra.backend.config;

import org.newtco.obserra.backend.storage.MemoryStorage;
import org.newtco.obserra.backend.storage.Storage;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Configuration class for storage-related beans.
 * This class configures the in-memory storage as the primary storage implementation.
 */
@Configuration
public class StorageConfig {

    /**
     * Creates and registers the MemoryStorage bean as the primary Storage implementation.
     *
     * @return the MemoryStorage instance
     */
    @Bean
    @Primary
    public Storage memoryStorage() {
        return new MemoryStorage();
    }
}