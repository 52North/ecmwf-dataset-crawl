export default class Crawl implements CrawlResponse {
  name: string
  languages: any[] // TODO: get type from ../languages
  commonKeywords: KeywordGroup
  keywordGroups: KeywordGroup[]
  crawlOptions: CrawlOptions

  id?: string
  started?: Date
  completed?: Date

  constructor(crawl: CrawlResponse) {
    const {
      name,
      languages,
      commonKeywords,
      keywordGroups,
      crawlOptions,
      id,
      started,
      completed,
    } = crawl

    this.name = name
    this.languages = languages
    this.commonKeywords = commonKeywords
    this.keywordGroups = keywordGroups
    this.crawlOptions = crawlOptions
    this.id = id
    this.started = started
    this.completed = completed
  }

  async save () : Promise<any> {}

  async processKeywords () : Promise<any> {
    // merge keywordGroups with common keywords

    // translate keywords

    // save updated document
  }

  async startCrawling () : Promise<any> {
    if (this.started) return

    // find seed urls for documents

    // insert seed URLs in new crawl status index
  }

  async stopCrawling () : Promise<any> {
    if (!this.started || this.completed) return

    // delete crawl status index
  }

  async toJson () : Promise<string> {
    // TODO: convert dates to ISO strings, move _id -> id, add resultCount
    return JSON.stringify(this)
  }

  async getResultCount () : Promise<number> {
    return 0
  }
}

interface CrawlResponse extends CrawlRequest {
  id?: string
  started?: Date
  completed?: Date
}

type CrawlRequest = {
  name: string
  languages: any[] // TODO: get type from ../languages
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

type KeywordGroup = {
  keywords: string[]
  translate: boolean
  keywordsProcessed?: string[]
}
