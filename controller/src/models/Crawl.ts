import {
  saveCrawl,
  addToStatusIndex,
  clearStatusIndex,
  deleteCrawl,
  getResultCount,
  deleteResults,
} from '../elastic'
import {
  languagesFromCountry,
  getDefaultLanguage
} from '../models/Language'
import { searcher, SearchResult } from '../search'
import { translator } from '../translation'
import createLogger from '../logging'
import cfg from '../config';

export default class Crawl implements CrawlResponse {
  static log = createLogger('crawl')

  name: string
  countries: string[]
  languages: string[]
  commonKeywords: KeywordGroup
  keywordGroups: KeywordGroup[]
  crawlOptions: CrawlOptions

  id?: string
  started?: Date
  completed?: Date
  processedKeywords?: ProcessedKeywordGroup[]
  seedUrls?: string[]
  resultCount?: number

  constructor (crawl: CrawlResponse) {
    const {
      name,
      countries,
      languages,
      commonKeywords,
      keywordGroups,
      crawlOptions,
      id,
      started,
      completed,
      processedKeywords,
      seedUrls,
    } = crawl

    this.name = name
    this.countries = countries
    this.languages = languages
    this.commonKeywords = commonKeywords
    this.keywordGroups = keywordGroups
    this.crawlOptions = crawlOptions
    this.id = id
    this.started = started
    this.completed = completed
    this.processedKeywords = processedKeywords
    this.seedUrls = seedUrls
  }

  async save (): Promise<Crawl> {
    try {
      const { id } = await saveCrawl(this)
      this.id = id
      return this
    } catch (err) {
      err.message = `could not save crawl ${this.id}: ${err.message}`
      Crawl.log.error({ err, crawlId: this.id })
      throw err
    }
  }

  async delete (clearResults = true): Promise<Crawl> {
    if (!this.id) {
      Crawl.log.warn('attempting to delete crawl without ID, aborting')
      return this
    }

    if (this.started) {
      await clearStatusIndex(this)
      if (clearResults) {
        await deleteResults([this.id])
      }
    }
    await deleteCrawl(this)
    return this
  }

  async processKeywords (): Promise<Crawl> {
    try {
      this.processedKeywords = []
      const defaultLang = getDefaultLanguage() // the language we receive the keywords in

      // TODO: allow to exclude default lang from processedKeywords?
      // TODO: filter duplicate languages
      for (const group of this.keywordGroups) {
        if (this.crawlOptions.searchUntranslated) {
          // add default language: just merge keywordGroups with common keywords
          // dont set a country for the default language, to avoid incorrect geofilter
          this.processedKeywords.push({
            language: defaultLang.iso639_1,
            keywords: Array.from(group.keywords.concat(this.commonKeywords.keywords)),
          })
        }

        if (!group.translate) continue

        // translate (common) keywords
        for (const country of this.countries) {
          if (country === defaultLang.iso3166_a2)
            continue // default lang was already added

          const keywords = this.commonKeywords.translate
            ? Array.from(group.keywords.concat(this.commonKeywords.keywords))
            : Array.from(group.keywords)

          // get languages from countries, filter by submitted languages list
          const availableLangs = (await translator.availableLanguages(defaultLang))
            .map(l => l.iso639_1)
          const languages = languagesFromCountry({ iso3166_a2: country })
            .filter(lang => this.languages.indexOf(lang.iso639_1) >= 0)
            .filter(lang => availableLangs.indexOf(lang.iso639_1) >= 0)

          for (const lang of languages) {
            // TODO: deduplicate languages by country, so we save some API quota..?
            // TODO: query for all languages at once? Azure supports this..
            let translated = await translator.translate(keywords, defaultLang, lang)

            if (!this.commonKeywords.translate)
              translated = translated.concat(this.commonKeywords.keywords)

            this.processedKeywords.push({
              language: lang.iso639_1,
              country,
              keywords: translated,
            })
          }
        }
      }

      const { id, processedKeywords, keywordGroups } = this
      Crawl.log.info({ crawlId: id, processedKeywords, keywordGroups }, 'processKeywords()')

      return this
    } catch (err) {
      err.message = `could not process keywords: ${err.message}`
      Crawl.log.error({ err, crawl: this })
      throw err
    }
  }

  async getSeedUrls (): Promise<Crawl> {
    try {
      if (!this.processedKeywords)
        throw new Error(`Can't fetch seed URLs for crawl ${this.id || this.name}: process keywords first.`)

      this.seedUrls = []

      // find seed urls for keywords
      for (const group of this.processedKeywords) {
        const { country, language, keywords } = group
        const results = await searcher.search(keywords, {
          numResults: this.crawlOptions.seedUrlsPerKeywordGroup,
          restrictCountry: cfg.search.restrictToCountry,
          country,
          language,
        })

        this.seedUrls = this.seedUrls
          .concat(results.map((r: SearchResult) => r.url))
      }

      if (!this.seedUrls.length)
        throw new Error(`Keywords ${JSON.stringify(this.processedKeywords)} did not yield any seed URLs`)

      Crawl.log.info({ crawlId: this.id, seedUrls: this.seedUrls }, 'getSeedUrls()')

      return this
    } catch (err) {
      err.message = `could not get seed URLs: ${err.message}`
      Crawl.log.error({ err, crawl: this })
      throw err
    }
  }

  async startCrawling (force = false): Promise<Crawl> {
    if (!this.id)
      throw new Error(`Can't start crawl ${this.name}: save first.`)
    if (this.started)
      throw new Error(`Can't start crawl ${this.id}: already running.`)
    if (!this.seedUrls)
      throw new Error(`Can't start crawl ${this.id}: fetch seed URLs first.`)

    const { duration, resultCount } = this.crawlOptions.terminationCondition
    if (!force && !duration && !resultCount) {
      throw new Error(`Will not start crawl ${this.id} without termination condition! Use "force" flag if you know what you are doing.`)
    }

    // insert seed URLs in new crawl status index
    await addToStatusIndex(this, this.seedUrls)

    this.started = new Date()
    return this.save()
  }

  async stopCrawling (): Promise<Crawl> {
    if (!this.started)
      throw new Error('Cant stop crawl before starting it!')
    if (this.completed)
      throw new Error('Crawl already stopped!')

    // NOTE: for this to have the effect of stopping the crawl, elasticsearch
    // must be configured with `action.auto_create_index: false`!
    await clearStatusIndex(this)
    this.completed = new Date()
    return this.save()
  }

  async serialize (withDynamicAttrs = false): Promise<CrawlResponse> {
    const res = JSON.parse(JSON.stringify(this))
    if (withDynamicAttrs)
      res.resultCount = await this.getResultCount()
    return res
  }

  async getResultCount (): Promise<number> {
    if (!this.started) return 0
    const { count } = await getResultCount([this.id] as string[])
    return count
  }
}

interface CrawlResponse extends CrawlRequest {
  id?: string
  started?: Date
  completed?: Date
  processedKeywords?: ProcessedKeywordGroup[]
  seedUrls?: string[]
  resultCount?: number
}

type CrawlRequest = {
  name: string
  countries: string[]
  languages: string[]
  commonKeywords: KeywordGroup
  keywordGroups: KeywordGroup[]
  crawlOptions: CrawlOptions
}

type CrawlOptions = {
  searchUntranslated: boolean
  recursion: number
  seedUrlsPerKeywordGroup: number
  domainBlacklist: string[]
  domainWhitelist: string[]
  terminationCondition: {
    resultCount?: number
    duration?: number
  }
}

type ProcessedKeywordGroup = {
  keywords: string[] // FIXME: enforce min length of 1 or handle empty case
  language: string // ISO639-1 code
  country?: string // ISO3166-1 alpha2 code
}

type KeywordGroup = {
  keywords: string[]
  translate: boolean
}
