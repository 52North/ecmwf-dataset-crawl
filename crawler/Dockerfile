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

COPY --from=0 /topology/target/crawler-alpha.jar /topology.jar
COPY *.yaml /
COPY *.flux /
COPY ES_IndexInit.sh /ES_IndexInit.sh
COPY top1K2016.txt /seeds
WORKDIR /
#CMD ./ES_IndexInit.sh; storm jar /topology.jar org.apache.storm.flux.Flux /es-injector.flux -local
CMD storm jar /topology.jar org.apache.storm.flux.Flux /es-crawler.flux -local
