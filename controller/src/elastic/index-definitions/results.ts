export default {
  index: 'results',
  body: {
    settings: {
      index: {
        number_of_shards: 5,
        number_of_replicas: 1,
        refresh_interval: '60s'
      }
    },
    mappings: {
      doc: {
        _source: {
          enabled: false
        },
        properties: {
          content: {
            type: 'text',
            index: 'true'
          },
          host: {
            type: 'keyword',
            index: 'true',
            store: true
          },
          title: {
            type: 'text',
            index: 'true',
            store: true
          },
          url: {
            type: 'keyword',
            index: 'false',
            store: true
          }
        }
      }
    }
  }
}
