# Use Maven image with OpenJDK 17
FROM maven:3.8.4-openjdk-17 AS build

# Set the working directory
WORKDIR /app

# Copy the pom.xml file and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy the source code
COPY src ./src

# Package the application
RUN mvn package -DskipTests

# Use a smaller JRE image for running the application
FROM openjdk:17-jdk-slim

# Set the working directory
WORKDIR /app

# Copy the JAR file from the build stage
COPY --from=build /app/target/turtrack-manager-0.0.1-SNAPSHOT.jar ./turtrack-manager-0.0.1-SNAPSHOT.jar

# Expose the application port
EXPOSE 9999

# Run the application
ENTRYPOINT ["java", "-jar", "turtrack-manager-0.0.1-SNAPSHOT.jar"]
