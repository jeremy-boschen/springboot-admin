plugins {
    `java-library`
    `maven-publish`
}

group = "org.newtco"
version = "1.0.0-SNAPSHOT"

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(17))
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // Jackson for JSON serialization/deserialization
    implementation("com.fasterxml.jackson.core:jackson-databind:2.15.2")
    
    // Test dependencies
    testImplementation("org.junit.jupiter:junit-jupiter:5.9.2")
}

tasks.withType<Copy>().configureEach {
    duplicatesStrategy = DuplicatesStrategy.INHERIT
}

// Create a sources jar
tasks.register<Jar>("sourcesJar") {
    from(sourceSets.main.get().allJava)
    archiveClassifier.set("sources")
}

// Create a javadoc jar
tasks.register<Jar>("javadocJar") {
    from(tasks.javadoc)
    archiveClassifier.set("javadoc")
}

// Configure Maven publishing
publishing {
    publications {
        create<MavenPublication>("mavenJava") {
            from(components["java"])
            artifact(tasks.named("sourcesJar"))
            artifact(tasks.named("javadocJar"))

            pom {
                name.set("Obserra Shared")
                description.set("Shared classes for Obserra components")
                url.set("https://github.com/jeremy-boschen/obserra")

                licenses {
                    license {
                        name.set("MIT License")
                        url.set("https://opensource.org/licenses/MIT")
                    }
                }

                developers {
                    developer {
                        id.set("jeremy-boschen")
                        name.set("Jeremy Boschen")
                        email.set("jeremy.boschen@gmail.com")
                    }
                }
            }
        }
    }
}

tasks.test {
    useJUnitPlatform()
}

// Enable the java library jar
tasks.jar {
    enabled = true
}