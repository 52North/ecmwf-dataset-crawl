import Configuration from './configuration'
import { ResultsApi, CrawlsApi } from './api'

// export instances of the API clients
const apiCfg = new Configuration({
  basePath: process.env.API_URL,
})

export const resultsApi = new ResultsApi(apiCfg)
export const crawlsApi = new CrawlsApi(apiCfg)
