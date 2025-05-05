package org.newtco.obserra.backend.model;

/**
 * Enum representing the possible sources of service registration.
 * This corresponds to the RegistrationSourceEnum in the schema.
 */
public enum RegistrationSource {
    KUBERNETES,
    DIRECT,
    MANUAL
}