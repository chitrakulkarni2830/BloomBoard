# Build stage using Eclipse Temurin JDK 21
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copy Maven wrapper and POM
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Make Maven wrapper executable inside Linux build container
RUN chmod +x ./mvnw

# Copy source code and build production JAR
COPY src src
RUN ./mvnw clean package -DskipTests

# Runtime stage using Eclipse Temurin JRE 21
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy executable JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Dynamic PORT environment variable is mapped by Spring Boot server.port=${PORT:8080}
EXPOSE 8080

ENTRYPOINT ["java", "-Xmx256m", "-Xss512k", "-Dspring.main.lazy-initialization=true", "-jar", "app.jar"]
