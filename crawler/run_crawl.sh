docker-compose up -d elasticsearch
./ES_IndexInit.sh
mvn clean compile
mvn exec:java -Dexec.mainClass=org.apache.storm.flux.Flux -Dexec.args="--local es-injector.flux --sleep 5000"
mvn exec:java -Dexec.mainClass=org.apache.storm.flux.Flux -Dexec.args="--local es-crawler.flux --sleep 240000"
