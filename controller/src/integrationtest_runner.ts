import { promisify } from 'util'
import Crawl from './models/Crawl'

/**
 * These Integration tests..
 * - verify that the setup Controller -> Elastic -> Crawler -> Elastic -> Controller
 *   works as expected.
 *
 * - validate the result quality of search results by submitting crawl requests
 *   with a known high result score, as well as crawls with an expected low
 *   result score.
 *
 * Test cases consist of a Crawl definition. To skip external API calls and save
 * API quota, only the processed keywords are provided. This may change when
 * there are more exotic test cases.
 */

const test1Germany = new Crawl({
  id: 'testcase-germany',
  name: 'testcase-germany',
  crawlOptions: {
    recursion: 2,
    seedUrlsPerKeywordGroup: 10,
  },
  processedKeywords: [
    { keywords: ['hydrologische', 'echtzeit', 'daten'], language: 'de', country: 'de' },
    { keywords: ['umwelt', 'daten', 'katalog'], language: 'de', country: 'de' },
  ],
} as Crawl)

const CRAWL_WAIT_MSECS = 1000 * 60 * 3
type Testcase = Crawl
const testcases: Testcase[] = [
  test1Germany
]

async function startTestCrawls (testcases: Testcase[]) {
  for (const testcase of testcases) {
    await testcase.getSeedUrls()
    await testcase.startCrawling()
  }
  return testcases
}

async function stopTestCrawls (testcases: Testcase[]) {
  for (const testcase of testcases) {
    await testcase.stopCrawling()
  }
  return testcases
}

async function evaluateTestCrawls (testcases: Testcase[]) {
  // TODO: inspect scores of results
  return testcases
}

const wait = promisify(setTimeout)

async function log (testcases: Testcase[], ...args: any[]) {
  console.log(testcases)
  args.map(v => console.log(v))
  return testcases
}

startTestCrawls(testcases)
  .then(tests => log(tests, `waiting ${CRAWL_WAIT_MSECS / 1000}s for crawler...`))
  .then(tests => wait(CRAWL_WAIT_MSECS, tests))
  .then(stopTestCrawls)
  .then(evaluateTestCrawls)
  .then(log)
  .catch(console.error)
