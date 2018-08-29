import { IndicesCreateParams } from 'elasticsearch'

import { client } from './'
import resultsMapping from './index-definitions/results'
import Result from '../models/Result'

interface ResultQuery {
  crawls?: string[]
  query?: string
  from?: number
  size?: number
  onlyCrawlLanguages?: boolean
}

interface ResultResponse {
  took?: number
  total?: number
  hits?: Result[]
}

export async function getResults (queryOpts: ResultQuery): Promise<ResultResponse> {
  const { crawls, query, from, size, onlyCrawlLanguages } = queryOpts

  const res = await client.search({
    index: resultsMapping.index,
    from,
    size,
    body: buildQueryBody(crawls, query, [
      { 'score': 'desc' },
      '_score',
    ], onlyCrawlLanguages),
  })

  return {
    total: res.hits.total,
    took: res.took,
    hits: res.hits.hits.map(d => Result.fromElastic(d._source)),
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
    refresh: true,
  })
  return { deleted }
}

export async function classifyUrls (urls: string[], label: string): Promise<any> {
  const { updated } = await client.updateByQuery({
    index: resultsMapping.index,
    type: 'doc',
    df: 'url',
    q: urls.map(u => `"${u}"`).join(' '),
    conflicts: 'proceed',
    refresh: true,
    body: {
      script: `ctx._source['classification.manual'] = '${label}'`,
    },
  })

  return { updated }
}

function buildQueryBody (crawls?: string[], query?: string, sort?: (string | object)[], langFilter = false) {
  const body = {
    query: { bool: { must: [], filter: [] } },
    sort,
  } as any

  if (query)
    body.query.bool.must.push({ query_string: { query } })

  if (crawls && crawls.length)
    body.query.bool.filter.push({ terms: { 'crawl.id': crawls } })

  if (langFilter) {
    body.query.bool.filter.push({
      script: {
        script: `
          def langs = doc['crawl.languages'];
          def l = doc['language'];
          if (langs.length == 0) return true;
          if (!(l instanceof List)) l = [l];
          if (l.length == 0) return false;
          return langs.contains(l[0]);`
      }
    })
  }

  return body
}
