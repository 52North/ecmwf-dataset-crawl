Fetch URLs from seedurls.txt, write HTML to /tmp/crawledPages/


With Storm installed, you can generate an uberjar:

``` sh
mvn clean package
```


With Elasticsearch running then use the following command to inject URLs into the topology

``` sh
./ES_IndexInit.sh # clear & set up indexes
storm jar target/crawler-alpha.jar  org.apache.storm.flux.Flux --local es-injector.flux
```

then crawl the seed urls:

``` sh
storm jar target/storm-crawler-fight-2.0-SNAPSHOT.jar  org.apache.storm.flux.Flux --local --sleep 600000 es-crawler.flux
```

Replace '--local' with '--remote' to deploy it on a running Storm cluster.

Alternatively, run the application via the following command, which can be adapted to allow debugging from IDEs:

```sh
mvn clean compile exec:java -Dexec.mainClass=org.apache.storm.flux.Flux -Dexec.args="--local crawler.flux --sleep 60000
```

