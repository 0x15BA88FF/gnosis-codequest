FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY . .
RUN mvn package -DskipTests

FROM quay.io/minio/mc:latest AS mc

FROM eclipse-temurin:21-jre
WORKDIR /app
EXPOSE 8080
COPY --from=mc /usr/bin/mc /usr/local/bin/mc
COPY --from=build /app/target/*.jar app.jar
COPY start.sh /start.sh
RUN chmod +x /start.sh
ENTRYPOINT ["/start.sh"]
