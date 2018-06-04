import {
  saveCrawl,
  addToStatusIndex,
  clearStatusIndex
} from '../elastic/controllers/crawls'
import {
  languagesFromCountry,
  getDefaultLanguage
} from '../models/Language'
import { searcher, SearchResult } from '../search'
import { translator } from '../translation'

export default class Crawl implements CrawlResponse {
  name: string
  countries: string[]
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
    const { id } = await saveCrawl(this)
    this.id = id
    return this
  }

  async processKeywords (): Promise<Crawl> {
    this.processedKeywords = []
    const defaultLang = getDefaultLanguage() // the language we receive the keywords in

    // TODO: allow to exclude default lang from processedKeywords?
    for (const group of this.keywordGroups) {
      // add default language: just merge keywordGroups with common keywords
      // dont set a country for the default language, to avoid incorrect geofilter
      this.processedKeywords.push({
        language: defaultLang.iso639_1,
        keywords: Array.from(group.keywords.concat(this.commonKeywords.keywords)),
      })

      if (!group.translate) continue

      // translate (common) keywords
      for (const country of this.countries) {
        if (country === defaultLang.iso3166_a2)
          continue // default lang was already added

        let keywords = this.commonKeywords.translate
          ? Array.from(group.keywords.concat(this.commonKeywords.keywords))
          : Array.from(group.keywords)

        // ignore all languages but the first for a country
        const language = languagesFromCountry({ iso3166_a2: country })[0]
        // keywords = await translator.translate(keywords, defaultLang, language) // TODO

        if (!this.commonKeywords.translate)
          keywords = keywords.concat(this.commonKeywords.keywords)

        this.processedKeywords.push({
          language: language.iso639_1,
          country,
          keywords
        })
      }
    }

    return this
  }

  async getSeedUrls (): Promise<Crawl> {
    if (!this.processedKeywords)
      throw new Error(`Can't fetch seed URLs for crawl ${this.id || this.name}: process keywords first.`)

    this.seedUrls = []

    // find seed urls for keywords
    for (const group of this.processedKeywords) {
      const { country, language, keywords } = group
      const results = await searcher.search(keywords, {
        numResults: this.crawlOptions.seedUrlsPerKeywordGroup,
        country,
        language,
      })

      this.seedUrls = this.seedUrls
        .concat(results.map((r: SearchResult) => r.url))
    }

    if (!this.seedUrls.length)
      throw new Error(`Keywords ${JSON.stringify(this.processedKeywords)} did not yield any seed URLs`)

    return this.save()
  }

  async startCrawling (): Promise<Crawl> {
    if (!this.id)
      throw new Error(`Cant start crawl ${this.name}: save first.`)
    if (this.started)
      throw new Error(`Cant start crawl ${this.id}: already running.`)
    if (!this.seedUrls)
      throw new Error(`Cant start crawl ${this.id}: fetch seed URLs first.`)

    // insert seed URLs in new crawl status index
    await addToStatusIndex(this, this.seedUrls)

    this.started = new Date()
    return this.save()
  }

  async stopCrawling (): Promise<Crawl> {
    if (!this.started || this.completed)
      throw new Error('Crawl is not running yet!')

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
    return 0 // TODO
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
  commonKeywords: KeywordGroup
  keywordGroups: KeywordGroup[]
  crawlOptions: CrawlOptions
}

type CrawlOptions = {
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
