import fs from 'fs'
import path from 'path'
import http from 'http'
import swaggerTools from 'swagger-tools'
import jsyaml from 'js-yaml'
import connect from 'connect'

import cfg from '../config'
import createLogger from '../logging'

const log = createLogger('api')

// swaggerRouter configuration
const options = {
  controllers: path.join(__dirname, './controllers'),
  useStubs: false,
}

// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
const spec = fs.readFileSync(path.join('./swagger.yaml'), 'utf8')
const swaggerDoc = jsyaml.safeLoad(spec)

// Initialize the Swagger middleware
const app = connect()

if (cfg.isDev) {
  const corsHandler: connect.NextHandleFunction = (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'content-type')
    next()
  }
  app.use(corsHandler)
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

const reqLogger: connect.NextHandleFunction = (req, res, next) => {
  log.info({ req })
  next()
}
app.use(reqLogger)

export default function startServer (serverPort: number) {
  return new Promise((resolve: any, reject: any) => {
    http.createServer(app).listen(serverPort, function (err: any) {
      if (err)
        return reject(err)

      log.info(`Server is listening on http://localhost:${cfg.apiPort}`)
      log.info(`Swagger-ui is available on http://localhost:${cfg.apiPort}/docs/`)
      resolve()
    })
  })
}
