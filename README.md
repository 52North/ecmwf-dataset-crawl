# ecmwf-dataset-crawl

A webcrawler for (hydrological) datasets.
Developed as part of the [ECMWF Summer of Weather Code](https://esowc.ecmwf.int).

More information can be found in the [wiki](https://github.com/noerw/ecmwf-dataset-crawl/wiki).


```sh
# get API keys for google custom search, Azure Text Translator
# and insert them into configuration via environment vars.
vi docker-compose.yml

# start all the services
docker-compose up --build --force-recreate -d

# stop the services
docker-compose down --volumes
```

Licensed under Apache License 2
