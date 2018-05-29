'use strict'

var { writeJson, respondWithCode } = require('../utils/writer')
var Crawls = require('../service/CrawlsService')

module.exports.addCrawl = function addCrawl (req, res, next) {
  var crawl = req.swagger.params['crawl'].value
  Crawls.addCrawl(crawl)
    .then(function (response) {
      writeJson(res, respondWithCode(201, response))
    })
    .catch(function (err) {
      writeJson(res, respondWithCode(500, err.message))
    })
}

module.exports.getCrawl = function getCrawl (req, res, next) {
  var crawlId = req.swagger.params['crawlid'].value
  Crawls.getCrawl(crawlId)
    .then(function (response) {
      writeJson(res, response)
    })
    .catch(function (err) {
      if (err.message.match('not found'))
        writeJson(res, respondWithCode(404, err.message))
      else
        writeJson(res, respondWithCode(500, err.message))
    })
}

module.exports.getCrawls = function getCrawls (req, res, next) {
  Crawls.getCrawls()
    .then(function (response) {
      writeJson(res, response)
    })
    .catch(function (err) {
      writeJson(res, respondWithCode(500, err.message))
    })
}

module.exports.handlePreflight = function handlePreflight (req, res, next) {
  Crawls.handlePreflight()
    .then(function (response) {
      writeJson(res, response)
    })
}

module.exports.handlePreflight2 = function handlePreflight2 (req, res, next) {
  var crawlId = req.swagger.params['crawlid'].value
  Crawls.handlePreflight2(crawlId)
    .then(function (response) {
      writeJson(res, response)
    })
}

module.exports.stopCrawl = function stopCrawl (req, res, next) {
  var crawlId = req.swagger.params['crawlid'].value
  Crawls.stopCrawl(crawlId)
    .then(function (response) {
      writeJson(res, response)
    })
    .catch(function (err) {
      if (err.message.match('not found'))
        writeJson(res, respondWithCode(404, err.message))
      else
        writeJson(res, respondWithCode(500, err.message))
    })
}
