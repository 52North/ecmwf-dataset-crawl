const e = process.env

export default {
  isDev: e.NODE_ENV === 'development',
  apiPort: e.API_PORT ? parseInt(e.API_PORT) : 9000, // tslint:disable-line
  loglevel: e.LOG_LEVEL || 'debug',
  elastic: {
    host: e.ELASTIC_HOST || 'localhost:9200',
  },
}
