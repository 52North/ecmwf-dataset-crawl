# build jar
FROM zenika/alpine-maven:3-jdk8 as build
WORKDIR /topology
# first download mvn deps
COPY pom.xml .
RUN mvn -B dependency:resolve-plugins dependency:resolve

# then copy remaining source + build. (fixes docker cache behaviour)
COPY . .
RUN mvn clean package

# run our topology in storm local mode
FROM storm:1.2 as storm
RUN apk --no-cache --virtual .build add curl

ENV FLUX_ENV production

WORKDIR /
COPY --from=0 /topology/target/crawler-alpha.jar ./topology.jar
COPY *.flux ./
COPY *.properties ./
CMD storm jar topology.jar org.apache.storm.flux.Flux --local --sleep 99999 --filter ${FLUX_ENV}.properties es-crawler.flux
