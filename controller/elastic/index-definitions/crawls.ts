'use strict'

export default {
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
          started: {
            type: 'date',
            format: 'dateTime',
          },
          completed: {
            type: 'date',
            format: 'dateTime',
          },
          domainBlacklist: { type: 'keyword' },
          domainWhitelist: { type: 'keyword' },
          seedUrls: { type: 'keyword' },
        }
      }
    },
  }
}
