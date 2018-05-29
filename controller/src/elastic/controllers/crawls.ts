import { IndicesCreateParams } from 'elasticsearch'

import Crawl from '../../models/Crawl'
import { client, ensureIndex } from '../'

export async function getCrawl (crawl: Crawl | any): Promise<Crawl> {
  const res = await client.search({
    index: crawlsMapping.index,
    q: `_id:${crawl.id}`,
  })

  if (!res.hits.total)
    throw new Error(`Crawl with id ${crawl.id} not found`)

  const crawlData = res.hits.hits[0]._source as Crawl
  crawlData.id = res.hits.hits[0]._id
  return new Crawl(crawlData)
}

export async function getCrawls (): Promise<Crawl[]> {
  const res = await client.search({
    index: crawlsMapping.index,
    q: `*:*`,
    size: 9999,
  })
  return res.hits.hits.reverse().map(d => {
    const crawlData = d._source as Crawl
    crawlData.id = d._id
    return new Crawl(crawlData)
  })
}

export async function saveCrawl (crawl: Crawl): Promise<Crawl> {
  const doc = await crawl.serialize()
  const res = await client.index({
    index: crawlsMapping.index,
    id: crawl.id, // may be undefined
    type: 'datapoint',
    body: doc,
    refresh: 'true',
  })
  crawl.id = res._id
  return crawl
}

export async function addToStatusIndex (crawl: Crawl, urls: string[]) {
  await ensureIndex(crawlStatusMapping(crawl))

  const docs = urls.map(url => ([
    { index: { _index: getCrawlStatusId(crawl), _type: 'status' } },
    { url, status: 'DISCOVERED', nextFetchDate: new Date(), metadata: { crawl: crawl.id } }
  ]))

  // @ts-ignore
  return client.bulk({ body: [].concat(...docs) })
}

export async function clearStatusIndex (crawl: Crawl) {
  return client.indices.delete({ index: getCrawlStatusId(crawl) })
}

function getCrawlStatusId (crawl: Crawl) {
  if (!crawl.id) throw new Error(`Crawl needs an ID before creating a Status Index`)
  return `crawlstatus-${crawl.id}`
}

function crawlStatusMapping (crawl: Crawl) {
  return {
    index: getCrawlStatusId(crawl),
    body: {
      settings: {
        index: {
          number_of_shards: 10,
          number_of_replicas: 0,
          refresh_interval: '5s',
        },
      },
      mappings: {
        status: {
          dynamic_templates: [{
            metadata: {
              path_match: 'metadata.*',
              match_mapping_type: 'string',
              mapping: { type: 'keyword' },
            },
          }],
          _source: { enabled: true },
          properties: {
            nextFetchDate: {
              type: 'date',
              format: 'dateOptionalTime',
            },
            status: { type: 'keyword' },
            url: { type: 'keyword' }
          }
        }
      }
    }
  }
}

export const crawlsMapping: IndicesCreateParams = {
  index: 'crawls',
  body: {
    settings: {
      index: {
        number_of_shards: 1,
        refresh_interval: '30s'
      },
      number_of_replicas: 0
    },
    mappings: {
      datapoint: {
        _source: { enabled: true },
        properties: {
          name: { type: 'keyword' },
          crawlOptions: {
            properties: {
              recursion: { type: 'integer' },
              seedUrlsPerKeywordGroup: { type: 'integer' },
              domainBlacklist: { type: 'keyword' },
              domainWhitelist: { type: 'keyword' },
              terminationCondition: {
                properties: {
                  resultCount: { type: 'integer' },
                  duration: { type: 'integer' },
                }
              }
            }
          },
          languages: { type: 'keyword' },
          commonKeywords: {
            properties: {
              keywords: { type: 'keyword' },
              translate: { type: 'boolean' },
            }
          },
          keywordGroups: {
            properties: {
              keywords: { type: 'keyword' },
              translate: { type: 'boolean' },
            }
          },
          id: { type: 'keyword' },
          started: { type: 'date', format: 'dateTime' },
          completed: { type: 'date', format: 'dateTime' },
          processedKeywords: {
            properties: {
              keywords: { type: 'keyword' },
              language: { type: 'keyword' },
            }
          },
          seedUrls: { type: 'keyword' },
        }
      }
    },
  }
}
