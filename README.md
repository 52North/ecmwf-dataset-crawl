# ARCHIVED

This project is no longer maintained and will not receive any further updates. If you plan to continue using it, please be aware that future security issues will not be addressed.

# ecmwf-dataset-crawl
> A webcrawler for (hydrological) datasets.
> Developed as part of the [ECMWF Summer of Weather Code](https://esowc.ecmwf.int) 2018.

Within the project "Web Crawler for hydrological Data" we have developed a web
crawling solution for multilingual discovery of environmental data sets.
The discovered pages can help to add new data sources to global predictive
weather forecasting models.

The application offers a specialised web search engine, which can be tasked to
discover websites containing data sets based on keywords and countries.
Keywords for each task are automatically translated into the languages of the
desired countries to support multilingual discovery.
Each discovered web-page's content is classified with its probability of linking
to data by a custom trained machine learning model.
Relevant content such as contact information, data license and direct-links is
extracted and indexed for faster accessibility.

A web based user interface offers list of pages with their extracted content,
sorted by relevance. These results can be filtered with a full text search or
on metadata such as content language, classification label.
Each result can be manually classified into categories, to help in training new
models for the machine learning classifier.
The interface furthermore offers usability features such as direct links to
translated pages and search queries.
Comparative assessment of the different keywords can be done in a visualization
of the crawler's performance metrics.

Design notes & more information can be found in the [wiki](https://github.com/52north/ecmwf-dataset-crawl/wiki).

# run (docker-compose)
> you can also have a look in the [wiki](https://github.com/52North/ecmwf-dataset-crawl/wiki/docker-compose-deployment) for more hints.

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

To configure Kibana visualizations:

- set `action.auto_create_index` to `true` in `elasticsearch/config/elasticsearch.yml`
    and restart elasticsearch with `docker-compose restart elasticsearch`
- visit <http://localhost/kibana/app/kibana#/management/objects> and click "Import".
- select `kibana/saved_objects.json` from this project's directory.
- mark any of the index patterns as "favorite" (star button)
- reset the elasticsearch configuration and restart it again.

# dev
For information about the development environment, look  at the readme of each
component.

---

Licensed under Apache License 2
