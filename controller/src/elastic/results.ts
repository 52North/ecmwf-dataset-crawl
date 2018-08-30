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
  let res

  try {
    res = await client.search({
      index: resultsMapping.index,
      from,
      size,
      body: buildQueryBody(crawls, query, onlyCrawlLanguages),
    })
  } catch (err) {
    let e = err
    try {
      e = new Error(JSON.stringify(JSON.parse(err.response).error.failed_shards[0].reason, null, 2))
    } finally {
      throw e
    }
  }

  return {
    total: res.hits.total,
    took: res.took,
    hits: res.hits.hits.map(d => Result.fromElastic(d._source)),
  }
}

export async function getResultCount (crawls?: string[], query?: string): Promise<{ count: number }> {
  const { count } = await client.count({
    index: resultsMapping.index,
    body: buildQueryBody(crawls, query),
  })
  return { count }
}

export async function deleteResults (crawls?: string[], query?: string): Promise<{ deleted: number }> {
  const { deleted } = await client.deleteByQuery({
    index: resultsMapping.index,
    body: buildQueryBody(crawls, query),
    refresh: true,
  })
  return { deleted }
}

export async function classifyUrls (urls: string[], label: 'dataset' | 'related' | 'unrelated'): Promise<{ updated: number }> {
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

function buildQueryBody (crawls?: string[], query?: string, langFilter = false) {
  const must: any[] = []
  const body = {
    query: {
      function_score: {
        query: { bool: { must } },
        score_mode: 'sum',
        functions: [{
          // score by manual classification
          weight: 3,
          script_score: {
            script: {
              source: `
                def m = doc['classification.manual'];
                if (m.length == 0) return 0;
                m = m[0];
                if (m == "dataset") return 1;
                else if (m == "related") return 0.5;
                else if (m == "unrelated") return -1;
                else return 0;
              `,
            },
          },
        }, {
          // score by automatic classification
          weight: 1,
          script_score: {
            script: {
              source: `
                def m = doc['classification.confidence'];
                if (m.length == 0) return 0;
                return m[0];
              `,
            },
          },
        }, {
          // score by extracted content features
          weight: 1,
          script_score: {
            script: {
              source: `
                Map fields = new HashMap(); // field <-> weight mapping
                fields.put('extracted.data_portal', 1.0);
                fields.put('extracted.data_api', 1.0);
                fields.put('extracted.data_link', 1.0);
                fields.put('extracted.data_pdf', 1.0);
                fields.put('extracted.contact', 1.0);
                fields.put('extracted.license', 1.0);
                fields.put('extracted.dataset', 1.0);
                fields.put('extracted.realtime', 1.0);
                fields.put('extracted.historic', 1.0);

                def score = 0.0;
                for (f in fields.keySet()) {
                  if (doc.containsKey(f) && doc[f].length != 0)
                    score += fields.get(f);
                }
                return score / 9; // normalize with sum of all field weights
              `,
            },
          },
        }],
      }
    },
  } as any

  if (query)
    must.push({ query_string: { query } })

  if (crawls && crawls.length)
    must.push({ terms: { 'crawl.id': crawls } })

  if (langFilter) {
    must.push({
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
