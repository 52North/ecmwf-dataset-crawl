import api from './api'
import cfg from './config'
import { initializeIndizes } from './elastic'

async function main () {
  await api(cfg.apiPort)
  if (cfg.isDev) {
    console.log(`Server is listening on http://localhost:${cfg.apiPort}`)
    console.log(`Swagger-ui is available on http://localhost:${cfg.apiPort}/docs/`)
  }

  await initializeIndizes()
}

main().catch(err => {
  console.error(`Unhandled ${err.constructor.name}: ${err.message}
  ${err.stack}`)
})
