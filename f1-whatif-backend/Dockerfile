# syntax=docker/dockerfile:1

# ---- Stage 1: build the jar and split it into layers ------------------------------------
FROM eclipse-temurin:25-jdk AS build
WORKDIR /workspace

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
# A checkout on Windows can leave CRLF line endings in the script, which Linux cannot run.
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw
# Dependencies first, so this layer is reused as long as pom.xml does not change.
RUN ./mvnw -B -q dependency:go-offline

COPY src/ src/
RUN ./mvnw -B -q -DskipTests package \
    && cp target/*.jar application.jar \
    && java -Djarmode=tools -jar application.jar extract --layers --destination extracted

# ---- Stage 2: the image that runs on Cloud Run ------------------------------------------
FROM eclipse-temurin:25-jre
RUN useradd --system --uid 1001 --no-create-home app
WORKDIR /app

# Least-changing layers first, so a code change only rebuilds the last one.
COPY --from=build /workspace/extracted/dependencies/ ./
COPY --from=build /workspace/extracted/spring-boot-loader/ ./
COPY --from=build /workspace/extracted/snapshot-dependencies/ ./
COPY --from=build /workspace/extracted/application/ ./

USER app
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080

# Settings for a small container:
#  MaxRAMPercentage  leaves memory for things outside the heap (threads, metaspace)
#  UseSerialGC       the smallest garbage collector, enough for one or two CPUs
#  TieredStopAtLevel=1  skips the slow optimizing compiler, which speeds up startup
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=70", "-XX:+UseSerialGC", "-XX:TieredStopAtLevel=1", "-Xss512k", "-jar", "application.jar"]
