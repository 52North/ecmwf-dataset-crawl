'use strict'

const { Client } = require('elasticsearch')

const cfg = require('../config')
const indexes = require('./index-definitions')

const client = new Client(cfg.elastic)

async function ensureIndex (indexDefinition, purge = false) {
  const exists = await client.indices.exists(indexDefinition)
  if (exists && purge)
    await client.indices.delete({ index: indexDefinition.index })
  if (!exists || purge)
    await client.indices.create(indexDefinition)
}

module.exports.addCrawlStatusIndex = async function addCrawlStatusIndex (crawl) {
  // create copy of definition first
  const def = JSON.parse(JSON.stringify(indexes.crawlStatus))
  def.index = `crawlstatus-${crawl.id}`
  // IDEA: use index templates instead?
  return ensureIndex(def)
}

module.exports.initializeIndizes = async function initializeIndizes (purge = false) {
  await client.ping({})
  await ensureIndex(indexes.crawls, purge)
  await ensureIndex(indexes.crawlerMetrics, purge)
  await ensureIndex(indexes.results, purge)
}
