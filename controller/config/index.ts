'use strict'

export default {
  isDev: process.env.NODE_ENV === 'development',
  apiPort: process.env.API_PORT ? parseInt(process.env.API_PORT) : 9000,
  elastic: {
    host: process.env.ELASTIC_HOST || 'localhost:9200',
    log: process.env.ELASTIC_LOGLEVEL || 'debug',
  },
}
