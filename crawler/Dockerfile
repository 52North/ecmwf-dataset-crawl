# build jar
FROM maven:3.5-jdk-8
WORKDIR /topology

# install python dependencies
RUN apt-get update && apt-get install -y python3-pip && apt-get clean

# first download mvn deps
COPY pom.xml .
RUN mvn -B dependency:resolve-plugins dependency:resolve

ENV pythontarget=src/main/resources/resources
COPY $pythontarget/requirements.txt ./$pythontarget/
RUN pip3 install -r $pythontarget/requirements.txt --target $pythontarget

# then copy remaining source + build. (fixes docker cache behaviour)
COPY src ./src
#RUN mvn clean package
RUN mvn clean compile

ARG http_proxy
ENV ES_ADDRESS http://elasticsearch:9200/
ENV FETCH_THREADS 20
ENV CRAWLER_MEMORY 2048
ENV PROXY_HOST ${http_proxy}
ENV PROXY_PORT 8080
ENV PROXY_TYPE HTTPS

# run our topology in local mode (without storm executable)
COPY *.flux ./
CMD mvn exec:java -Dexec.mainClass=org.apache.storm.flux.Flux -Dexec.args="--local --sleep 99999999 --env-filter es-crawler.flux"

# alternatively, run jar with storm (local mode)

#FROM storm:1.2 as storm
#RUN apk --no-cache --virtual .build add curl
#
#ARG http_proxy
#
#ENV ES_ADDRESS http://elasticsearch:9200/
#ENV FETCH_THREADS 20
#ENV CRAWLER_MEMORY 2048
#ENV PROXY_HOST ${http_proxy}
#ENV PROXY_PORT 8080
#ENV PROXY_TYPE HTTPS
#
#WORKDIR /
#COPY --from=0 /topology/target/crawler-alpha.jar ./topology.jar
#COPY *.flux ./
#CMD storm jar topology.jar org.apache.storm.flux.Flux --local --sleep 9999999 --env-filter es-crawler.flux
