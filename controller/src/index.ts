import api from './api'
import cfg from './config'
import { initializeIndizes } from './elastic'
import createLogger from './logging'
import CrawlWatchdog from './watchdog'

const log = createLogger('main')
const goodBoy = new CrawlWatchdog(cfg)

async function main () {
  goodBoy.patrol() // start watchdog first, so it definitely runs even when later inits fail
  await api(cfg.apiPort)
  await initializeIndizes(false)
}

main().catch(err => {
  log.error({ err }, 'Unhandled Exception!')
})
