'use strict'

module.exports = {
  index: 'crawler-metrics',
  body: {
    template: 'metrics*',
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
          srcComponentId: { type: 'keyword' },
          srcTaskId: { type: 'long' },
          srcWorkerHost: { type: 'keyword' },
          srcWorkerPort: { type: 'long' },
          timestamp: {
            type: 'date',
            format: 'dateOptionalTime'
          },
          value: { type: 'double' }
        }
      }
    }
  }
}
