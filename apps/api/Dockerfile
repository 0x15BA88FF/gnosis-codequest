FROM quay.io/minio/mc:latest AS mc

FROM eclipse-temurin:21-jre
WORKDIR /app
EXPOSE 8080
COPY --from=mc /usr/bin/mc /usr/local/bin/mc
COPY target/gnosis-api-0.0.1-SNAPSHOT.jar app.jar
COPY start.sh /start.sh
RUN chmod +x /start.sh
ENTRYPOINT ["/start.sh"]