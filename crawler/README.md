# Crawler

Based on Apache Storm + Flux. Depends on Running elasticsearch instance.
Can be configured via `*.flux` files, as well as via environments in `*.properties`.

To build a bundle that can be run with storm: see `Dockerfile`

To run the topology without a storm executable:
```sh
mvn clean compile exec:java -Dexec.mainClass=org.apache.storm.flux.Flux -Dexec.args="--local --sleep 60000 --filter dev.properties es-crawler.flux"
```
