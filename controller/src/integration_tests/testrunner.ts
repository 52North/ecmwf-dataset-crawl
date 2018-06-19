import { promisify } from 'util'
import Crawl from '../models/Crawl'
import { addCrawl } from '../api/service/CrawlsService';
import { deleteResults } from '../elastic'
import testcases, { Testcase } from './testcases'

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

const CRAWL_WAIT_MSECS = 1000 * 60 * 5

async function clearResults(testcases: Testcase[]) {
  for (const t of testcases) {
    try {
      await t.delete()
    } catch (err) {}
  }

  return testcases
}

async function startTestCrawls (testcases: Testcase[]) {
  for (const testcase of testcases) {
    await addCrawl(testcase)
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

function log (...args: any[]) {
  args.map(v => console.log(JSON.stringify(v, null, 2)))
  return testcases
}

clearResults(testcases)
  .then(startTestCrawls)
  .then(tests => log(tests, `waiting ${CRAWL_WAIT_MSECS / 1000}s for crawler...`))
  .then(tests => wait(CRAWL_WAIT_MSECS, tests))
  .then(stopTestCrawls)
  .then(evaluateTestCrawls)
  .then(log)
  .catch(console.error)
