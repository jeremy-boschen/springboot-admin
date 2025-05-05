package org.newtco.obserra.backend.model;

/**
 * Enum representing the possible types of configuration properties.
 * This corresponds to the PropertyTypeEnum in the schema.
 */
public enum PropertyType {
    STRING,
    NUMBER,
    BOOLEAN,
    ARRAY,
    MAP,
    JSON,
    YAML
}