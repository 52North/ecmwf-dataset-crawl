import { Client, IndicesCreateParams } from 'elasticsearch'

import cfg from '../../config'
import Crawl from '../../models/Crawl'
import { client, ensureIndex } from '../'

export async function saveCrawl (crawl: Crawl) {
  const doc = JSON.parse(crawl.toJson())

  const res = await client.index({
    index: crawlsMapping.index,
    id: crawl.id, // may be undefined
    type: 'datapoint',
    body: doc,
  })

  crawl.id = res._id
  return crawl
}

function getNewId() {
  return '1'
}

export async function addCrawlStatusIndex (crawl: Crawl) {
  // IDEA: use index templates instead?
  const def = crawlStatusMapping(`crawlstatus-${crawl.id}`)
  return ensureIndex(def)
}

function crawlStatusMapping(index: string) {
  return {
    index,
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
              seedUrlsPerKeywordsGroup: { type: 'integer' },
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
          seedUrls: { type: 'keyword' },
        }
      }
    },
  }
}
