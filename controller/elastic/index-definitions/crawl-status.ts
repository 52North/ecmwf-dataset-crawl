'use strict'

export default {
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
