import { promisify } from 'util'

import api from './api'
import cfg from './config'
import { initializeIndizes, client } from './elastic'
import createLogger from './logging'
import { searcher } from './search'
import { translator } from './translation'
import CrawlWatchdog from './watchdog'

const log = createLogger('main')
const goodBoy = new CrawlWatchdog(cfg)

const wait = promisify(setTimeout)

async function main ({ retries = 0, timeout = 10 }): Promise<any> {
  try {
    await client.ping({})
    await initializeIndizes(false)
    await api(cfg.apiPort)
    goodBoy.patrol()
  } catch (err) {
    if (!retries || err.message !== 'No Living connections') throw err
    log.error(`Could not connect to elasticsearch, retrying in ${timeout}s (${retries} retries left)`)
    return wait(timeout * 1000)
      .then(() => main({ retries: retries - 1, timeout }))
  }

  await searcher.init()
  await translator.init()
}

main({ retries: 6, timeout: 5 }).catch(err => {
  log.error({ err }, 'Unhandled Exception!')
  process.exit(1)
})
