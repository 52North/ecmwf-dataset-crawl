# Crawler

Based on Apache Storm + Flux. Depends on Running elasticsearch instance and a python 3.6 installation.
Can be configured via environment variables. All variables in `.env` must be set.

To run the topology without a storm executable:
```sh
env $(cat .env | xargs) \
  mvn compile exec:java -Dexec.mainClass=org.apache.storm.flux.Flux -Dexec.args="\
  --local --sleep 99999999 --env-filter es-crawler.flux"
```

To build a bundle that can be run with storm:

```sh
mvn package
env $(cat .env | xargs) storm jar target/crawler-alpha.jar org.apache.storm.flux.Flux --local --sleep 99999999 --env-filter ./es-crawler.flux
```

## installation
The crawler makes use of storm's multilang support to use a classifier written in python.
The resources for this classifier are located in `src/main/resources/resources`
(due to classpath weirdness in the generated jar) with all dependencies vendored in that directory.
To reinstall these sources, run

```sh
target=src/main/resources/resources pip install -r $target/requirements.txt --target $target
```
