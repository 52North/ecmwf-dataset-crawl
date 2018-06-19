'use strict'

var { writeJson, respondWithCode } = require('../utils/writer')
var Crawls = require('../service/CrawlsService')
const { log } = require('../')

module.exports.addCrawl = function addCrawl (req, res, next) {
  var crawl = req.swagger.params['crawl'].value
  Crawls.addCrawl(crawl)
    .then(function (response) {
      writeJson(res, respondWithCode(201, response))
      log.info({ req, res, crawl: response }, 'crawl added')
    })
    .catch(function (err) {
      writeJson(res, respondWithCode(500, err.message))
      log.error({ err, req, res, crawl }, 'could not add crawl')
    })
}

module.exports.getCrawl = function getCrawl (req, res, next) {
  var crawlId = req.swagger.params['crawlid'].value
  Crawls.getCrawl(crawlId)
    .then(function (crawl) {
      writeJson(res, crawl)
      log.info({ req, res, crawl }, `getCrawl(${crawlId})`)
    })
    .catch(function (err) {
      if (err.message.match('not found')) {
        writeJson(res, respondWithCode(404, err.message))
        log.warn({ req, res, crawlId }, 'could not get crawl: not found')
      } else {
        writeJson(res, respondWithCode(500, err.message))
        log.error({ err, req, res, crawlId }, 'could not get crawl')
      }
    })
}

module.exports.getCrawls = function getCrawls (req, res, next) {
  Crawls.getCrawls()
    .then(function (crawls) {
      writeJson(res, crawls)
      log.info({ req, res, crawls: crawls.length }, `getCrawls()`)
    })
    .catch(function (err) {
      writeJson(res, respondWithCode(500, err.message))
      log.error({ err, req, res }, 'could not get crawls')
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
      log.info({ req, res, crawl }, `stopCrawl(${crawlId})`)
    })
    .catch(function (err) {
      if (err.message.match('not found')) {
        writeJson(res, respondWithCode(404, err.message))
        log.warn({ req, res, crawlId }, 'could not stop crawl: not found')
      } else {
        writeJson(res, respondWithCode(500, err.message))
        log.error({ err, req, res, crawlId }, 'could not stop crawl')
      }
    })
}
