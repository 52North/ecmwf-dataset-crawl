# Crawler

Based on Apache Storm + Flux. Depends on Running elasticsearch instance.
Can be configured via environment variables. All variables in `.env` must be set.

To run the topology without a storm executable:
```sh
env $(cat .env | xargs) \
  mvn compile exec:java -Dexec.mainClass=org.apache.storm.flux.Flux -Dexec.args="\
  --local --sleep 99999999 --env-filter es-crawler.flux"
```

To build a bundle that can be run with storm: see `Dockerfile`

