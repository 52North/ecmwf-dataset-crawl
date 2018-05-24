'use strict'

const api = require('./api')
const cfg = require('./config')
const elastic = require('./elastic')

async function main () {
  await api.startServer(cfg.apiPort)
  if (cfg.isDev) {
    console.log(`Server is listening on http://localhost:${cfg.apiPort}`)
    console.log(`Swagger-ui is available on http://localhost:${cfg.apiPort}/docs/`)
  }

  await elastic.initializeIndizes()
}

main().catch(err => {
  console.error(`Unhandled ${err.constructor.name}: ${err.message}
  ${err.stack}`)
})
