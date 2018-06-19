import { Client, IndicesCreateParams } from 'elasticsearch'

import cfg from '../config'
import log from './logger'

import crawlerMetricsMapping from './index-definitions/crawler-metrics'
import resultsMapping from './index-definitions/results'
import { crawlsMapping } from './crawls'

export const client = new Client(Object.assign({}, cfg.elastic, { log }))
const logger = new log({})

export async function initializeIndizes (purge = false) {
  await client.ping({})
  if (purge) {
    logger.warn('purging all indizes!')
    await client.indices.delete({ index: 'crawlstatus-*' })
  }

  await ensureIndex(crawlsMapping, purge)
  await ensureIndex(crawlerMetricsMapping, purge)
  await ensureIndex(resultsMapping, purge)
}

export async function ensureIndex (indexDefinition: IndicesCreateParams, purge = false) {
  const exists = await client.indices.exists(indexDefinition)
  if (exists && purge)
    await client.indices.delete({ index: indexDefinition.index })
  if (!exists || purge)
    await client.indices.create(indexDefinition)
  logger.debug({ indexDefinition }, `(re)created index ${indexDefinition.index}`)
}

export * from './crawls'
export * from './results'
