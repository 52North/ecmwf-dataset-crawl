import { IndicesCreateParams } from 'elasticsearch'

import { client } from './'
import resultsMapping from './index-definitions/results'
import Result from '../models/Result'

export async function getResults (crawls?: string[], query?: string, from?: number, size?: number): Promise<{ total: number, hits: Result[] }> {
  const res = await client.search({
    index: resultsMapping.index,
    from,
    size,
    body: buildQueryBody(crawls, query),
  })
  return {
    total: res.hits.total,
    hits: res.hits.hits.map(d => new Result(d._source as Result)),
  }
}

export async function getResultCount (crawls?: string[], query?: string): Promise<any> {
  const { count } = await client.count({
    index: resultsMapping.index,
    body: buildQueryBody(crawls, query),
  })
  return { count }
}

export async function deleteResults (crawls?: string[], query?: string): Promise<any> {
  const { deleted } = await client.deleteByQuery({
    index: resultsMapping.index,
    body: buildQueryBody(crawls, query),
  })
  return { deleted }
}

function buildQueryBody(crawls?: string[], query?: string) {
  const body = { query: {} } as any
  const crawlFilter = crawls && crawls.length
    ? { terms: { crawl: crawls } }
    : null

  if (query) {
    body.query.bool = {
      must: { query_string: { query } }
    }
    body.query.bool.filter = crawlFilter
  } else {
    body.query = crawlFilter || { match_all: {} }
  }

  return body
}
