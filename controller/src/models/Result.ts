export default class Result {
  url: string
  host: string
  title: string
  crawl: string
  content: string
  scores: ResultScores

  constructor (params: Result ) {
    const { url, host, title, crawl, scores, content } = params

    this.url = url
    this.host = host
    this.title = title
    this.crawl = crawl
    this.scores = {
      dataset: scores.dataset
    }
    this.content = content
  }

  toJson (): string {
    return JSON.stringify(this)
  }
}

type ResultScores = {
  dataset: number
  [k: string]: number
}
