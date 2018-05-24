import fs from 'fs'
import path from 'path'
import http from 'http'
import swaggerTools from 'swagger-tools'
import jsyaml from 'js-yaml'
import connect from 'connect'

import cfg from '../config'

// swaggerRouter configuration
var options = {
  controllers: path.join(__dirname, './controllers'),
  useStubs: cfg.isDev, // Conditionally turn on stubs (mock mode)
}

// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
var spec = fs.readFileSync('./swagger.yaml', 'utf8')
var swaggerDoc = jsyaml.safeLoad(spec)

// Initialize the Swagger middleware
const app = connect()

if (cfg.isDev) {
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'content-type')
    next()
  })
}

swaggerTools.initializeMiddleware(swaggerDoc, function (middleware: any) {
  // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
  app.use(middleware.swaggerMetadata())

  // Validate Swagger requests
  app.use(middleware.swaggerValidator())

  // Route validated requests to appropriate controller
  app.use(middleware.swaggerRouter(options))

  // Serve the Swagger documents and Swagger UI
  app.use(middleware.swaggerUi())
})

if (cfg.isDev) {
  app.use((req, res, next) => {
    console.log(`${new Date()}\t ${req.method} ${req.url}`)
    next()
  })
}

export default function startServer (serverPort: number) {
  return new Promise((resolve: any, reject: any) => {
    http.createServer(app).listen(serverPort, function (err: any) {
      if (err) reject(err)
      else resolve()
    })
  })
}
