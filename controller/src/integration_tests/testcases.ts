import Crawl from '../models/Crawl'

/**
 * These Integration tests..
 * - verify that the setup Controller -> Elastic -> Crawler -> Elastic -> Controller
 *   works as expected.
 *
 * - validate the result quality of search results by submitting crawl requests
 *   with a known high result score, as well as crawls with an expected low
 *   result score.
 *
 * Test cases consist of a Crawl definition.
 */

export type Testcase = Crawl

function testCrawl (id: string, keywordGroups: any, countries: string[], languages: string[], options = {}) {
  const crawlDef = {
    id,
    name: id,
    crawlOptions: {
      recursion: 2,
      seedUrlsPerKeywordGroup: 10,
      domainBlacklist: [],
      domainWhitelist: [],
      terminationCondition: {},
      searchUntranslated: false,
    },
    commonKeywords: { keywords: [], translate: true },
    keywordGroups,
    languages,
    countries,
  }

  return new Crawl(Object.assign(crawlDef, options))
}

// high scores expected
const test1KnownData = testCrawl('testcase-known', [
  { keywords: ['hydrological', 'realtime', 'data'], translate: true },
  { keywords: ['environmental', 'geo-data', 'catalog'], translate: true },
  { keywords: ['precipitation', 'timeseries', 'open', 'data-set'], translate: true },
], ['de'], ['de'])

// low scores expected
const test2Unrelated = testCrawl('testcase-unrelated', [
  // unrelated content but similar keywords
  { keywords: ['micro-marketing', 'geo-data'], translate: true },
  { keywords: ['tax', 'data'], translate: true },
  { keywords: ['market', 'real-time', 'data'], translate: true },
  { keywords: ['natural', 'language', 'processing', 'data'], translate: true },
  { keywords: ['rest', 'api', 'data'], translate: true },
  { keywords: ['natural', 'language', 'processing', 'data'], translate: true },
  { keywords: ['data', 'science', 'scholarship'], translate: true },
  { keywords: ['book', 'review', 'portal'], translate: true },
  { keywords: ['environment', 'news'], translate: true },

  // completely unrelated stuff, so the model can learn about the world
  { keywords: ['food', 'blogs'], translate: true },
  { keywords: ['gardening', 'tips'], translate: true },
  { keywords: ['public', 'health', 'care', 'agencies'], translate: true },
  { keywords: ['kernel', 'development'], translate: true },
  { keywords: ['springfield', 'news'], translate: true },
  { keywords: ['cute', 'cat', 'pictures'], translate: true },
], ['de'], ['de'])

// unknown scores
const test3UnknownData = testCrawl('testcase-unknown', [
  { keywords: ['hydrological', 'realtime', 'data'], translate: true },
  { keywords: ['environmental', 'geo-data', 'catalog'], translate: true },
  { keywords: ['precipitation', 'timeseries', 'open', 'data-set'], translate: true },
], ['gh', 'ng', 'ml', 'sd', 'dz', 'tz', 'sn'], [])

const testcases: Testcase[] = [
  test1KnownData,
  test2Unrelated,
  test3UnknownData,
]

export default testcases
