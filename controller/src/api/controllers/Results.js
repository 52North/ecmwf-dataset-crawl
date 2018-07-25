'use strict'

var { writeCsv, writeJson, respondWithCode } = require('../utils/writer')
var Results = require('../service/ResultsService')
const { log } = require('../')

module.exports.deleteResults = function deleteResults (req, res, next) {
  var crawls = req.swagger.params['crawls'].value
  var query = req.swagger.params['query'].value
  Results.deleteResults(crawls, query)
    .then(function (response) {
      writeJson(res, response)
      const { deleted } = response
      log.info({ req, res, deleted }, 'deleteResults()')
    })
    .catch(function (err) {
      writeJson(res, respondWithCode(500, err.message))
      log.error({ err, req, res }, 'could not delete resuls')
    })
}

module.exports.getResultCount = function getResultCount (req, res, next) {
  var crawls = req.swagger.params['crawls'].value
  var query = req.swagger.params['query'].value
  Results.getResultCount(crawls, query)
    .then(function (response) {
      writeJson(res, respondWithCode(200, response))
      const { count } = response
      log.info({ req, res, count }, 'getResultCount()')
    })
    .catch(function (err) {
      writeJson(res, respondWithCode(500, err.message))
      log.error({ err, req, res }, 'could not get result count')
    })
}

module.exports.getResults = function getResults (req, res, next) {
  var crawls = req.swagger.params['crawls'].value
  var query = req.swagger.params['query'].value
  var size = req.swagger.params['size'].value
  var from = req.swagger.params['from'].value
  var format = req.swagger.params['format'].value
  var download = req.swagger.params['download'].value
  Results.getResults(crawls, query, from, size)
    .then(function (response) {
      const payload = (download || format === 'csv') ? response.hits : response
      if (download)
        res.setHeader('Content-Disposition', `attachment; filename=results.${format || 'json'}`)

      if (format == 'csv')
        writeCsv(res, payload)
      else
        writeJson(res, payload)

      log.info({ req, res, count: response.total }, 'getResults()')
    })
    .catch(function (err) {
      writeJson(res, respondWithCode(500, err.message))
      log.error({ err, req, res }, 'could not get results')
    })
}

module.exports.classifyResults = function classifyResults (req, res, next) {
  const params = req.swagger.params['classifyRequest'].value
  const { urls, label } = params
  Results.classifyResults(urls, label)
    .then(function (response) {
      writeJson(res, respondWithCode(200, response))
      const { count } = response
      log.info({ req, res, count, urls, label }, 'classifyResults()')
    })
    .catch(function (err) {
      writeJson(res, respondWithCode(500, err.message))
      log.error({ err, req, res, urls, label }, 'could not get classify results')
    })
}

module.exports.handlePreflight3 = function handlePreflight3 (req, res, next) {
  Results.handlePreflight3()
    .then(function (response) {
      writeJson(res, response)
    })
    .catch(function (err) {
      writeJson(res, respondWithCode(500, err.message))
    })
}
