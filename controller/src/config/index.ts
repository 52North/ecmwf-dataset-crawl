import { GcsSearchOpts } from '../search/SearchApiGoogle'
import { AzureTextTranslatorOpts } from '../translation/TranslationApiAzure'
import { LogLevel } from 'bunyan'

const e = process.env

const cfg = {
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
  translation: {
    azure: {
      subscriptionKey: e.AZURE_SUBKEY
    } as AzureTextTranslatorOpts,
  },
}

// validate that params without default are set
if (!cfg.translation.azure.subscriptionKey)
  throw new Error('Missing config translation.azure.subscriptionKey')
if (!cfg.search.google.searchEngineId)
  throw new Error('Missing config search.google.searchEngineId')
if (!cfg.search.google.apiKey)
  throw new Error('Missing config search.google.apiKey')

export default cfg
