plugins {
    `java-library`
    `maven-publish`
    id("org.springframework.boot") version "3.2.0"
    id("io.spring.dependency-management") version "1.1.4"
}

group = "org.newtco"
version = "1.0.0-SNAPSHOT"

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(17))
    }

    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}

repositories {
    mavenCentral()
}

dependencyManagement {
    imports {
        mavenBom(org.springframework.boot.gradle.plugin.SpringBootPlugin.BOM_COORDINATES)
    }
}

dependencies {
    // Spring Boot dependencies (minimal set)
    compileOnly("org.springframework.boot:spring-boot-starter")
    compileOnly("org.springframework.boot:spring-boot-starter-web")
    compileOnly("org.springframework.boot:spring-boot-actuator-autoconfigure")

    // Spring Boot Auto Configuration
    compileOnly("org.springframework.boot:spring-boot-autoconfigure")
    annotationProcessor("org.springframework.boot:spring-boot-autoconfigure-processor")
    annotationProcessor("org.springframework.boot:spring-boot-configuration-processor")

    // Logging - using SLF4J API as recommended by Spring Boot
    implementation("org.slf4j:slf4j-api")

    // Obserra shared module
    implementation(project(":obserra-shared"))

    // Test dependencies
    testImplementation("org.springframework.boot:spring-boot-starter-test")
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
                name.set("Obserra Spring Boot Starter")
                description.set("Spring Boot starter for applications to register with the Obserra dashboard")
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

// Disable the Spring Boot application plugin to build as a library
tasks.bootJar {
    enabled = false
}

// Enable the java library jar
tasks.jar {
    enabled = true

    // Ensure auto-configuration metadata is included
    from("build/classes/java/main") {
        include("META-INF/**")
        duplicatesStrategy = DuplicatesStrategy.INCLUDE
    }
}
