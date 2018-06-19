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

function testCrawl(id: string, keywordGroups: any, countries: string[], options = {}) {
  const crawlDef = {
    id,
    name: id,
    crawlOptions: {
      recursion: 2,
      seedUrlsPerKeywordGroup: 10,
      domainBlacklist: [],
      domainWhitelist: [],
      terminationCondition: {},
    },
    commonKeywords: { keywords: [], translate: true },
    keywordGroups,
    countries,
  }

  return new Crawl(Object.assign(crawlDef, options))
}

// high scores expected
const test1KnownData = testCrawl('testcase-known', [
  { keywords: ['hydrological', 'realtime', 'data'], translate: true },
  { keywords: ['environmental', 'geo-data', 'catalog'], translate: true },
  { keywords: ['precipitation', 'timeseries', 'open', 'data-set'], translate: true },
], ['de'])

// low scores expected
const test2Unrelated = testCrawl('testcase-unrelated', [
  { keywords: ['micro-marketing', 'geo-data'], translate: true }, // similar keywords, different domain
  { keywords: ['cat-pictures'], translate: true },                // unrelated
], ['de'])

// unknown scores
const test3UnknownData = testCrawl('testcase-unknown', [
  { keywords: ['hydrological', 'realtime', 'data'], translate: true },
  { keywords: ['environmental', 'geo-data', 'catalog'], translate: true },
  { keywords: ['precipitation', 'timeseries', 'open', 'data-set'], translate: true },
], ['gh', 'ng', 'ml', 'sd', 'dz', 'tz', 'sn'])

const testcases: Testcase[] = [
  test1KnownData,
  test2Unrelated,
  test3UnknownData,
]

export default testcases
