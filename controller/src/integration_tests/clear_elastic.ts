import { initializeIndizes } from '../elastic'
import createLogger from '../logging'

const log = createLogger('main')

async function main () {
  await initializeIndizes(true)
}

main().catch(err => {
  log.error({ err }, 'Unhandled Exception!')
})
