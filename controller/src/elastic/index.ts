import { Client, IndicesCreateParams } from 'elasticsearch'

import cfg from '../config'
import Crawl from '../models/Crawl'
import indexes from './index-definitions'
import log from './logger'

export const client = new Client(Object.assign(cfg.elastic, { log }))

export async function initializeIndizes (purge = false) {
  await client.ping({})
  await ensureIndex(indexes.crawls, purge)
  await ensureIndex(indexes.crawlerMetrics, purge)
  await ensureIndex(indexes.results, purge)
}

export async function ensureIndex (indexDefinition: IndicesCreateParams, purge = false) {
  const exists = await client.indices.exists(indexDefinition)
  if (exists && purge)
    await client.indices.delete({ index: indexDefinition.index })
  if (!exists || purge)
    await client.indices.create(indexDefinition)
}

export * from './controllers/crawls'
