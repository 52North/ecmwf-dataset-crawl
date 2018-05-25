# ecmwf-dataset-crawl controller
Component responsible for management of crawls + communication with frontend

Contains business logic for
- creating / starting / crawls
- generating seed URLs for a crawl from keyword list

Provides an HTTP API for crawl management + result retrieval.

## howto build
see `Dockerfile`

## howto dev
```sh
# configure custom config options via environment variables, see src/config
vi .env

# continuously compile typescript
yarn build:watch

# run with hot reload
yarn start:dev

# lint code
yarn lint
```
