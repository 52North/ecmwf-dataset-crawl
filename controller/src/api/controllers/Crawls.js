'use strict'

var { writeJson, respondWithCode } = require('../utils/writer')
var Crawls = require('../service/CrawlsService')
const { log } = require('../')

module.exports.addCrawl = function addCrawl (req, res, next) {
  var crawl = req.swagger.params['crawl'].value
  Crawls.addCrawl(crawl)
    .then(function (response) {
      log.info({ req, res, crawl: response }, 'crawl added')
      writeJson(res, respondWithCode(201, response))
    })
    .catch(function (err) {
      log.error({ err, req, res, crawl }, 'could not add crawl')
      writeJson(res, respondWithCode(500, err.message))
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
        log.warn({ req, res, crawlId }, 'could not get crawl: not found')
        writeJson(res, respondWithCode(404, err.message))
      } else {
        log.error({ err, req, res, crawlId }, 'could not get crawl')
        writeJson(res, respondWithCode(500, err.message))
      }
    })
}

module.exports.getCrawls = function getCrawls (req, res, next) {
  Crawls.getCrawls()
    .then(function (crawls) {
      log.info({ req, res, crawls: crawls.length }, `getCrawls()`)
      writeJson(res, crawls)
    })
    .catch(function (err) {
      log.error({ err, req, res }, 'could not get crawls')
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
    .then(function (crawl) {
      log.info({ req, res, crawl }, `stopCrawl(${crawlId})`)
      writeJson(res, crawl)
    })
    .catch(function (err) {
      if (err.message.match('not found')) {
        log.warn({ req, res, crawlId }, 'could not stop crawl: not found')
        writeJson(res, respondWithCode(404, err.message))
      } else {
        log.error({ err, req, res, crawlId }, 'could not stop crawl')
        writeJson(res, respondWithCode(500, err.message))
      }
    })
}
