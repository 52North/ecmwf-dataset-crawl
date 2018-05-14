# build jar
FROM zenika/alpine-maven:3-jdk8
COPY ./ /topology/
RUN cd /topology && mvn clean package

# run our topology in storm local mode
FROM storm:1.2
COPY --from=0 /topology/target/crawler-alpha.jar /topology.jar
COPY --from=0 /topology/crawler-conf.yaml /crawler-conf.yaml

CMD [ "storm", "jar", "/topology.jar", "org.n52.webcrawl.CrawlTopology", "-local", "-conf /crawler-conf.yaml" ]
