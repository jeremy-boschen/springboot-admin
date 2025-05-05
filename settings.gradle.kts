plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version "0.8.0"
}

rootProject.name = "obserra"


println("Gradle version: ${gradle.gradleVersion}")
println("Java version:   ${JavaVersion.current()}")
println("JAVA_HOME:      ${System.getenv("JAVA_HOME")}")
println("GRADLE_HOME:    ${System.getenv("GRADLE_HOME")}")


include(":obserra-backend")
include(":obserra-spring-boot-starter")
include(":obserra-spring-boot-samples:demo-app-gradle")


