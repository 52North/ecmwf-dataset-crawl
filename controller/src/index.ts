import api from './api'
import cfg from './config'
import { initializeIndizes } from './elastic'
import createLogger from './logging'

const log = createLogger('main')

async function main () {
  await api(cfg.apiPort)
  await initializeIndizes(cfg.isDev)
}

main().catch(err => {
  log.error({ err }, 'Unhandled Exception!')
})
