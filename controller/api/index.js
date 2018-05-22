'use strict'

const fs = require('fs')
const path = require('path')
const http = require('http')
const swaggerTools = require('swagger-tools')
const jsyaml = require('js-yaml')
const connect = require('connect')

const cfg = require('../config')

// swaggerRouter configuration
var options = {
  controllers: path.join(__dirname, './controllers'),
  useStubs: cfg.isDev, // Conditionally turn on stubs (mock mode)
}

// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
var spec = fs.readFileSync(path.join(__dirname, './swagger.yaml'), 'utf8')
var swaggerDoc = jsyaml.safeLoad(spec)

// Initialize the Swagger middleware
const app = connect()

if (cfg.isDev) {
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    next()
  })
}

swaggerTools.initializeMiddleware(swaggerDoc, function (middleware) {
  // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
  app.use(middleware.swaggerMetadata())

  // Validate Swagger requests
  app.use(middleware.swaggerValidator())

  // Route validated requests to appropriate controller
  app.use(middleware.swaggerRouter(options))

  // Serve the Swagger documents and Swagger UI
  app.use(middleware.swaggerUi())
})

module.exports.startServer = function startServer (serverPort) {
  return new Promise((resolve, reject) => {
    http.createServer(app).listen(serverPort, function (err) {
      if (err) reject(err)
      else resolve()
    })
  })
}
