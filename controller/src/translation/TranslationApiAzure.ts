import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

import { TranslationApi, TranslationQueryOptions } from './'
import createLogger from '../logging'
import { Language } from '../models/Language'

export default class TranslationApiAzure implements TranslationApi {
  private ENDPOINT = 'https://api.cognitive.microsofttranslator.com'
  private RESULTS_PER_PAGE = 25
  private opts: AzureTextTranslatorOpts
  private log: any

  constructor (options: AzureTextTranslatorOpts) {
    this.opts = options
    this.log = createLogger('TranslationApiAzure')
  }

  async init () { /* no init required */ }

  async availableLanguages (fromLang?: Language): Promise<Language[]> {
    const reqOpts = this.requestParams({ scope: 'translation' })
    const res = await axios.get(`${this.ENDPOINT}/languages`, reqOpts)
    const result: Language[] = []
    for (const lang in res.data.translation) {
      result.push({
        name: res.data['translation'][lang].name,
        iso639_1: lang,
      })
    }
    return result
  }

  async translate (terms: string[], from: Language, to: Language, options?: TranslationQueryOptions): Promise<string[]> {
    // IDEA: optimize by requesting multiple languages at once?
    // generate requests for each 25 phrases (limited per request)
    const reqOpts = this.requestParams({
      from: from.iso639_1,
      to: to.iso639_1,
    })
    const requests = []
    for (let i = 0; i < terms.length; i += this.RESULTS_PER_PAGE) {
      const phrases = terms.slice(i, i + this.RESULTS_PER_PAGE)
      const req = this.requestTranslation(phrases, reqOpts)
        .then(this.parseTranslationResponse.bind(this))
      requests.push(req)
    }

    return Promise.all(requests)
      // @ts-ignore // flatten array of responses to a single results list
      .then(results => [].concat(...results))
      .catch(err => {
        this.log.error({ err })
        throw new Error(`Error querying Azure Translator: ${err}`)
      })
  }

  private async parseTranslationResponse (res: AxiosResponse): Promise<string[]> {
    const result = []
    this.log.debug(res)
    for (const phrase of res.data) {
      try {
        result.push(phrase.translations[0].text)
      } catch (err) {
        this.log.warn(`Could not translate a term ${phrase}: ${err}`)
      }
    }
    return result
  }

  private async requestTranslation (phrases: string[], params: AxiosRequestConfig): Promise<AxiosResponse> {
    const body = phrases.map(t => ({ 'Text': t }))
    try {
      const res = await axios.post(`${this.ENDPOINT}/translate`, body, params)
      return res
    } catch (err) {
      // catch rate limit for better msg
      if (err.response.data.error.code === 403000)
        throw new Error('Monthly (?) rate limit exceeded, returning without results')

      throw new Error(err.response.data.error.message)
    }
  }

  // https://docs.microsoft.com/en-us/azure/cognitive-services/translator/reference/v3-0-translate
  private requestParams (parameters?: any, headers?: any): AxiosRequestConfig {
    const { subscriptionKey } = this.opts
    return {
      params: Object.assign({
        'api-version': '3.0',
      }, parameters),
      headers: Object.assign({
        'Ocp-Apim-Subscription-Key' : subscriptionKey,
        'ClientTraceId': 'asdf',
      }, headers),
    }
  }
}

export type AzureTextTranslatorOpts = {
  subscriptionKey: string
}
