import DataObjectParser from 'dataobject-parser'

export default class Result {
  url: string
  host: string
  title: string
  crawl: string
  content: string // page text
  language?: string

  score: number                        // combined score for ranking
  classification: ResultClassification // classification result(s)
  extracted: ExtractionContent         // extracted content per topic
  keywords: string[]                   // extracted & given page keywords

  extra: Object // move remaining fields to 'extra' namespace for prototyping

  constructor (params: Result) {
    const {
      url, host, title, crawl, content, language,
      score, classification, keywords, extracted,
      ...extra
    } = params

    this.crawl = crawl
    this.url = url
    this.host = host
    this.title = title
    this.content = content
    this.language = language

    this.score = score
    this.classification = classification
    this.keywords = keywords
    this.extracted = extracted

    this.extra = extra
  }

  static fromElastic (val: any): Result {
    // convert from dot notation to nested object
    const result = DataObjectParser.transpose(val).data() as Result

    if (!result.classification)
      result.classification = {}
    if (!result.extracted)
      result.extracted = {}

    // coerce types (string -> number, string | string[] -> string[])
    result.score = Number(result.score)
    if (result.classification.auto)
      result.classification.confidence = Number(result.classification.confidence)
    result.keywords = asArray(result.keywords)
    for (const k in result.extracted) {
      result.extracted[k] = asArray(result.extracted[k])
    }

    return new Result(result)
  }

  toJson (): string {
    return JSON.stringify(this)
  }
}

type ResultClass = 'dataset' | 'unrelated' | undefined
type ResultClassification = {
  auto?: ResultClass
  confidence?: number
  manual?: ResultClass
}

type ExtractionContent = {
  [k: string]: string[]
}

function asArray (val: any) {
  if (val === undefined) return []
  return Array.isArray(val) ? val : [val]
}
