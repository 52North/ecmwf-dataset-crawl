# build jar
FROM zenika/alpine-maven:3-jdk8 as build
WORKDIR /topology
# first download mvn deps
COPY pom.xml .
RUN mvn -B dependency:resolve-plugins dependency:resolve

# then copy remaining source + build. (fixes docker cache behaviour)
COPY src ./src
RUN mvn clean package

# run our topology in storm local mode
FROM storm:1.2 as storm
RUN apk --no-cache --virtual .build add curl

ARG http_proxy

ENV ES_ADDRESS http://elasticsearch:9200/
ENV FETCH_THREADS 20
ENV CRAWLER_MEMORY 2048
ENV PROXY_HOST ${http_proxy}
ENV PROXY_PORT 8080
ENV PROXY_TYPE HTTPS

WORKDIR /
COPY --from=0 /topology/target/crawler-alpha.jar ./topology.jar
COPY *.flux ./
CMD storm jar topology.jar org.apache.storm.flux.Flux --local --sleep 9999999 --env-filter es-crawler.flux
