import {
  saveCrawl,
  addToStatusIndex,
  clearStatusIndex
} from '../elastic/controllers/crawls'
import {
  Language,
  getLanguageFromValue,
  getDefaultLanguage
} from '../models/Language'
import { searcher, SearchResult } from '../search'
import { translator } from '../translation'

export default class Crawl implements CrawlResponse {
  name: string
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
    const { id } = await saveCrawl(this)
    this.id = id
    return this
  }

  async processKeywords (): Promise<Crawl> {
    this.processedKeywords = []
    const defaultLang = getDefaultLanguage()

    // FIXME: language interface
    // FIXME: filter untranslated keywordGroups
    // FIXME: handle empty keyword groups
    for (const group of this.keywordGroups) {
      // add default language: just merge keywordGroups with common keywords
      this.processedKeywords.push({
        language: defaultLang,
        keywords: Array.from(group.keywords.concat(this.commonKeywords.keywords)),
      })

      if (!group.translate) continue

      // translate (common) keywords
      for (const lang of this.languages) {
        let keywords = this.commonKeywords.translate
          ? Array.from(group.keywords.concat(this.commonKeywords.keywords))
          : Array.from(group.keywords)

        const language = getLanguageFromValue({ code: lang })
        // keywords = await translator.translate(keywords, defaultLang, language) // TODO

        if (!this.commonKeywords.translate)
          keywords = keywords.concat(this.commonKeywords.keywords)

        this.processedKeywords.push({ language, keywords })
      }
    }

    return this
  }

  async getSeedUrls (): Promise<Crawl> {
    if (!this.processedKeywords)
      throw new Error(`Cant fetch seed URLs for crawl ${this.id || this.name}: process keywords first.`)

    this.seedUrls = []

    // find seed urls for keywords
    for (const group of this.processedKeywords) {
      const { language, keywords } = group
      const results = await searcher.search(keywords, {
        numResults: this.crawlOptions.seedUrlsPerKeywordGroup,
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
      throw new Error('crawl is not running yet!')

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
  languages: string[] // TODO: how to handle base lang 'en'?
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
  language: Language
}

type KeywordGroup = {
  keywords: string[]
  translate: boolean
}
