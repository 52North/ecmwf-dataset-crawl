# ecmwf-dataset-crawl

A webcrawler for (hydrological) datasets.
Developed as part of the [ECMWF Summer of Weather Code](https://esowc.ecmwf.int).

More information can be found in the [wiki](https://github.com/noerw/ecmwf-dataset-crawl/wiki).

```sh
# get API keys for google custom search, Azure Text Translator
# and insert them into configuration via environment vars.
# each required VAR is documented in the file.
vi .env

# start all the services
docker-compose up --build --force-recreate -d

# stop the services
docker-compose stop

# stop the services DELETING ALL DATA
docker-compose down --volumes
```

To configure Kibana visualizations, visit <http://localhost/kibana/app/kibana#/management/objects>
and click "Import". Select `saved_objects.json` from this project's `kibana` directory.

---

Licensed under Apache License 2
