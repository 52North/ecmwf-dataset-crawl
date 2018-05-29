import axios from 'axios'

import { SearchApi, SearchQueryOptions, SearchResult } from './'
import createLogger from '../logging'

export class SearchApiGoogle implements SearchApi {
  opts: GcsSearchOpts
  log: any
  RESULTS_PER_PAGE = 10
  MAX_RESULTS = 100

  constructor (options: GcsSearchOpts) {
    this.opts = options
    this.log = createLogger('SearchApiGoogle')
  }

  async init () { /* no init requried */ }

  async search (terms: string[], options?: SearchQueryOptions): Promise<SearchResult[]> {
    let {
      numResults: numResults = this.RESULTS_PER_PAGE,
      language: language = undefined,
      restrictLang: restrictLang = undefined,
    } = (options) ? options : {}

    if (numResults > this.MAX_RESULTS) {
      this.log.warn('This API provides at most 100 results, truncating')
      numResults = this.MAX_RESULTS
    }

    // FIXME: validate available languages / countries. country != language! google just ignores invalid codes..
    // https://developers.google.com/custom-search/docs/xml_results_appendices#countryCollections
    const params: GcsReqParams = {
      q: terms.map(encodeURIComponent).join('+'),
      gl: language ? language.code : undefined, // geolocation
      lr: (restrictLang && language) ? `lang_${language.code}` : undefined, // document language
      cr: (restrictLang && language) ? `country${language.code.toUpperCase()}` : undefined, // host country
    }

    // generate request params for each request page (10 results per page)
    const requests = new Array(Math.floor((numResults - 1) / this.RESULTS_PER_PAGE) + 1)
      .fill(1)
      .map((n, i) => Object.assign({ start: i * 10 + 1 }, params))
      .map(p => this.request(p).then(this.parseResponse))

    return Promise.all(requests)
      // flatten array of responses to a single results list
      .then(results => {
        // @ts-ignore
        return [].concat(...results)
          .filter((v: SearchResult, i: number) => i < numResults)
      })
      .catch(err => {
        this.log.error(err)
        throw new Error(`Error querying Google Search: ${err}`)
      })
  }

  private async request (parameters: GcsReqParams): Promise<any> {
    const endpoint = 'https://www.googleapis.com/customsearch/v1'
    const { searchEngineId: cx, apiKey: key } = this.opts
    const params = Object.assign({ cx, key }, parameters)

    // FIXME: filter PDFs?
    // FIXME: check sorting?

    try {
      const res = await axios.get(endpoint, { params })
      return res.data
    } catch (err) {
      // catch rate limit: just return nothing
      if (err.response.data.error.errors[0].reason === 'dailyLimitExceeded') {
        this.log.warn('Daily Rate Limit Exceeded, returning without results')
        return { items: [] }
      } else {
        throw err
      }
    }
  }

  private async parseResponse (response: any): Promise<SearchResult[]> {
    // IDEA: parse site.pagemap.metatags already?
    return response.items.map((site: any) => ({
      url: site.link,
      title: site.title,
    }))
  }
}

export type GcsSearchOpts = {
  searchEngineId: string
  apiKey: string
}

// https://developers.google.com/custom-search/json-api/v1/reference/cse/list#parameters
type GcsReqParams = {
  q: string
  start?: number
  cr?: string
  gl?: string
  lr?: string
}
