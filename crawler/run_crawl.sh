export INDEXNAME=training-final
export RESULTSDIR=training-final
export SEEDLIST="*.tsv"

docker-compose up -d elasticsearch
./ES_IndexInit.sh
mvn clean compile
mvn exec:java -Dexec.mainClass=org.apache.storm.flux.Flux -Dexec.args="--env-filter --local es-injector.flux --sleep 9000"
mvn exec:java -Dexec.mainClass=org.apache.storm.flux.Flux -Dexec.args="--env-filter --local es-crawler.flux --sleep 3000000"
