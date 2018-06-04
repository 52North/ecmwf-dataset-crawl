import axios from 'axios'

import { SearchApi, SearchQueryOptions, SearchResult } from './'
import createLogger from '../logging'
import { languagesFromCountry } from '../models/Language'

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
      country: country = undefined,
      language: language = undefined,
      restrictCountry: restrictCountry = undefined,
    } = (options) ? options : {}

    if (numResults > this.MAX_RESULTS) {
      this.log.warn('This API provides at most 100 results, truncating')
      numResults = this.MAX_RESULTS
    }

    // set up language/country filters. google just ignores invalid codes, and seems to use
    // - for the language codes ISO 639-1,
    // - the country codes are mostly ISO3166-1 alpha-2, except UK, ghana?
    // https://developers.google.com/custom-search/docs/xml_results_appendices#countryCollections
    let cr = undefined
    let lr = undefined
    if (restrictCountry) {
      cr = country ? `country${country.toUpperCase()}` : undefined
      lr = `lang_${language || languagesFromCountry({ iso3166_a2: country })[0]}`
    }

    const params: GcsReqParams = {
      q: terms.map(encodeURIComponent).join('+'),
      gl: country, // user geolocation
      lr,          // document language
      cr,          // host country
    }

    // generate request params for each request page (10 results per page)
    const requests = new Array(Math.floor((numResults - 1) / this.RESULTS_PER_PAGE) + 1)
      .fill(1)
      .map((n, i) => Object.assign({ start: i * 10 + 1 }, params))
      .map(p => this.request(p).then(this.parseResponse.bind(this)))

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

    // filter unwanted formats, most notably PDFs
    params.orTerms = 'filetype:html filtetype:xml'

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
    if (!response.items)
      return []

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
  orTerms?: string
}
