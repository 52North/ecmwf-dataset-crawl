import { Client, IndicesCreateParams } from 'elasticsearch'

import cfg from '../../config'
import Crawl from '../../models/Crawl'
import indexes from '../index-definitions'
import { client, ensureIndex } from '../'

export async function addCrawlStatusIndex (crawl: Crawl) {
  // create copy of definition first
  const def = JSON.parse(JSON.stringify(indexes.crawlStatus))
  def.index = `crawlstatus-${crawl.id}`
  // IDEA: use index templates instead?
  return ensureIndex(def)
}
