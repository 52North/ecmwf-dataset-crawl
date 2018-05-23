# ecmwf-dataset-crawl

A webcrawler for (hydrological) datasets.
Developed as part of the [ECMWF Summer of Weather Code](https://esowc.ecmwf.int).

More information can be found in the [wiki](https://github.com/noerw/ecmwf-dataset-crawl/wiki).


```sh
# start all the services
docker-compose up --build --force-recreate -d

# start only front facing services (not the crawler)
docker-compose up proxy

# stop the services
docker-compose down --volumes
# stop the services
docker-compose down --volumes
```

Licensed under Apache License 2
