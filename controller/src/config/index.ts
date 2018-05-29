import { GcsSearchOpts } from '../search/SearchApiGoogle'
import { LogLevel } from 'bunyan'

const e = process.env

export default {
  isDev: e.NODE_ENV === 'development',
  loglevel: e.LOG_LEVEL || 'debug' as LogLevel,
  apiPort: e.API_PORT ? parseInt(e.API_PORT) : 9000, // tslint:disable-line
  frontendHost: e.FRONTEND_HOST || 'http://localhost:8080',
  elastic: {
    host: e.ELASTIC_HOST || 'localhost:9200',
  },
  search: {
    google: {
      searchEngineId: e.GCS_SEARCHID,
      apiKey: e.GCS_APIKEY,
    } as GcsSearchOpts,
  },
  defaultLanguage: 'gb',
}
