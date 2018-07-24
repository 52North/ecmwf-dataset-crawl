export default {
  index: 'results',
  body: {
    settings: {
      index: {
        number_of_shards: 5,
        number_of_replicas: 1,
        refresh_interval: '60s',
      }
    },
    mappings: {
      doc: {
        _source: { enabled: true },
        dynamic_templates: [{
          extracted: {
            path_match: 'extracted.*',
            mapping: {
              type: 'text',
              index: false,
              store: true,
            },
          },
        }],
        properties: {
          score: {
            type: 'scaled_float',
            scaling_factor: 1000,
            index: true,
            coerce: true,
          },
          classification: {
            type: 'object',
            properties: {
              auto: {
                type: 'keyword',
                index: true,
              },
              manual: {
                type: 'keyword',
                index: true,
              },
              confidence: {
                type: 'scaled_float',
                scaling_factor: 1000,
                index: true,
                null_value: 0,
                coerce: true,
              },
            },
          },
          language: {
            type: 'keyword',
            index: true,
          },
          keywords: {
            type: 'keyword',
            index: true,
          },
          content: {
            type: 'text',
            index: true,
          },
          crawl: {
            type: 'keyword',
            index: true,
          },
          host: {
            type: 'keyword',
            index: true,
          },
          title: {
            type: 'text',
            index: true,
          },
          url: {
            type: 'keyword',
            index: true,
          }
        }
      }
    }
  }
}
