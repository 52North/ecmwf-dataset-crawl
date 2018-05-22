'use strict'

const api = require('./api')
const cfg = require('./config')

async function main () {
  await api.startServer(cfg.apiPort)
  if (cfg.isDev) {
    console.log(`Server is listening on http://localhost:${cfg.apiPort}`)
    console.log(`Swagger-ui is available on http://localhost:${cfg.apiPort}/docs/`)
  }
}

main().catch(err => {
  console.error(`Unhandled Error: ${err}`)
})
