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

To configure Kibana visualizations, visit<http://localhost/kibana/app/kibana#/management/indices>
and create three index patterns:

- `crawlstatus-*`: no time filter
- `results`: no time filter
- `metrics`: time filter on `timestamp`

Then visit <http://localhost/kibana/app/kibana#/management/objects>
and import saved objects located in `kibana/saved_objects.json`.

---

Licensed under Apache License 2
