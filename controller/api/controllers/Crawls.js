'use strict'

var utils = require('../utils/writer.js')
var Crawls = require('../service/CrawlsService')

module.exports.addCrawl = function addCrawl (req, res, next) {
  var crawl = req.swagger.params['crawl'].value
  Crawls.addCrawl(crawl)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getCrawl = function getCrawl (req, res, next) {
  var crawlId = req.swagger.params['crawl-id'].value
  Crawls.getCrawl(crawlId)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getCrawls = function getCrawls (req, res, next) {
  Crawls.getCrawls()
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.stopCrawl = function stopCrawl (req, res, next) {
  var crawlId = req.swagger.params['crawl-id'].value
  Crawls.stopCrawl(crawlId)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}
