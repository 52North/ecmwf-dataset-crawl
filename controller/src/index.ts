import api from './api'
import cfg from './config'
import { initializeIndizes } from './elastic'
import createLogger from './logging'
import CrawlWatchdog from './watchdog'
import Crawl from './models/Crawl'

const log = createLogger('main')
const goodBoy = new CrawlWatchdog(cfg)

async function main () {
  await api(cfg.apiPort)
  await initializeIndizes(false)
  goodBoy.patrol()
}

main().catch(err => {
  log.error({ err }, 'Unhandled Exception!')
})
