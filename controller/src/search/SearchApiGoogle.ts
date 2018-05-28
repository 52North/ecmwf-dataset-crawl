import axios from 'axios'

import { SearchApi, SearchQueryOptions, SearchResult } from './'
import createLogger from '../logging'

export class SearchApiGoogle implements SearchApi {
  opts: GcsSearchOpts
  log: any
  RESULTS_PER_PAGE = 10
  MAX_RESULTS = 100

  constructor(options: GcsSearchOpts) {
    this.opts = options
    this.log = createLogger('SearchApiGoogle')
  }

  async init() {}

  async search (terms: string[], options?: SearchQueryOptions): Promise<SearchResult[]> {
    let {
      numResults: numResults = this.RESULTS_PER_PAGE,
      language: language = undefined,
      restrictLang: restrictLang = undefined,
    } = (options) ? options : {};

    if (numResults > this.MAX_RESULTS) {
      this.log.warn('This API provides at most 100 results, truncating')
      numResults = this.MAX_RESULTS
    }

    // FIXME: validate available languages / countries
    const params: GcsReqParams = {
      q: terms.map(encodeURIComponent).join('+'),
      gl: language, // geolocation
      lr: (restrictLang && language) ? `lang_${language}` : undefined, // document language
      cr: (restrictLang && language) ? `country${language.toUpperCase()}` : undefined, // host country
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
      .catch(this.log.error)
  }

  private async request (parameters: GcsReqParams): Promise<any> {
    const endpoint = 'https://www.googleapis.com/customsearch/v1'
    const { searchEngineId: cx, apiKey: key } = this.opts
    const params = Object.assign({ cx, key }, parameters)
    return axios.get(endpoint, { params })
  }

  private async parseResponse (response: any): Promise<SearchResult[]> {
    // IDEA: parse site.pagemap.metatags already?
    return response.data.items.map((site: any) => ({
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
