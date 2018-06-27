export INDEXNAME=trainingdata_unrelated
export RESULTSDIR=unrelated
export SEEDLIST=unrelated.tsv

#docker-compose up -d elasticsearch
#./ES_IndexInit.sh
mvn clean compile
#mvn exec:java -Dexec.mainClass=org.apache.storm.flux.Flux -Dexec.args="--env-filter --local es-injector.flux --sleep 5000"
mvn exec:java -Dexec.mainClass=org.apache.storm.flux.Flux -Dexec.args="--env-filter --local es-crawler.flux --sleep 3000000"
