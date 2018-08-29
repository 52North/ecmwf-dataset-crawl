# Custom configuration for StormCrawler
# This is used to override the default values from crawler-default.xml and provide additional ones
# for your custom components.
# Use this file with the parameter -config when launching your extension of ConfigurableTopology.
# This file does not contain all the key values but only the most frequently used ones. See crawler-default.xml for an extensive list.

config:
  topology.workers: 1
  topology.message.timeout.secs: 300
  topology.max.spout.pending: 250
  topology.debug: false

  topology.worker.childopts: "-Djava.net.preferIPv4Stack=true"

  worker.heap.memory.mb: ${ENV-CRAWLER_MEMORY}

  fetcher.threads.number: ${ENV-FETCH_THREADS}

  # set to 50MB to handle sitemaps
  http.content.limit: 52428800

  partition.url.mode: byDomain

  # mandatory when using Flux
  topology.kryo.register:
    - com.digitalpebble.stormcrawler.Metadata

  # metadata to transfer to the outlinks
  # used by Fetcher for redirections, sitemapparser, etc...
  # these are also persisted for the parent document (see below)
  metadata.transfer:
   - crawl

  metadata.track.path: false
  metadata.track.depth: true

  # lists the metadata to persist to storage
  # these are not transfered to the outlinks
  metadata.persist:
   - crawl
   - parse.title
   - _redirTo
   - error.cause
   - error.source
   - isSitemap
   - isFeed

  http.agent.name: "ECMWF Dataset Crawler"
  http.agent.version: "0.1-alpha"
  http.agent.description: "ECMWF Dataset Crawler"
  http.agent.url: "https://github.com/52north/ecmwf-dataset-crawl"
  http.agent.email: "n.roosen@52north.org"
  http.proxy.host: "${ENV-PROXY_HOST}"
  http.proxy.port: "${ENV-PROXY_PORT}"
  http.proxy.type: "${ENV-PROXY_TYPE}"

  http.protocol.implementation: "com.digitalpebble.stormcrawler.protocol.okhttp.HttpProtocol"
  https.protocol.implementation: "com.digitalpebble.stormcrawler.protocol.okhttp.HttpProtocol"

  # FetcherBolt queue dump : comment out to activate
  # if a file exists on the worker machine with the corresponding port number
  # the FetcherBolt will log the content of its internal queues to the logs
  # fetcherbolt.queue.debug.filepath: "/tmp/fetcher-dump-{port}

  parsefilters.config.file: "parsefilters.json"
  urlfilters.config.file: "urlfilters.json"

  sitemap.discovery: true
  sitemap.sniffContent: true

  detect.charset.maxlength: 10000

  # revisit a page daily (value in minutes)
  # set it to -1 to never refetch a page
  fetchInterval.default: -1

  # revisit a page with a fetch error after 2 hours (value in minutes)
  # set it to -1 to never refetch a page
  fetchInterval.fetch.error: 120

  # never revisit a page with an error (or set a value in minutes)
  fetchInterval.error: -1

  # custom fetch interval to be used when a document has the key/value in its metadata
  # and has been fetched succesfully (value in minutes)
  # fetchInterval.isFeed=true: 10

  # configuration for the classes extending AbstractIndexerBolt
  # indexer.md.filter: "someKey=aValue"
  indexer.url.fieldname: "url"
  indexer.text.fieldname: "content"
  indexer.canonical.name: "canonical"
  indexer.md.mapping:
  - crawl=crawl # from init

  # storm crawler default filters
  - parse.title=title
  - parse.description=description
  - host=host

  - language=language # from LanguageDetectionFilter

  - classify.class=classification.auto
  - classify.confidence=classification.confidence

  # directly from parsefilters.json (XPath3Filter)
  - extracted.data_portal=extracted.data_portal
  - extracted.data_api=extracted.data_api
  - extracted.data_link=extracted.data_link
  - extracted.data_pdf=extracted.data_pdf
  - extracted.license=extracted.license
  - extracted.contact=extracted.contact

  - keywords=keywords # merged keyword list from ScoringBolt
  - score=score # from ScoringBolt

  status.updater.cache.spec: "maximumSize=500000,expireAfterAccess=1h"


