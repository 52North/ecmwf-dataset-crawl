'use strict'

var utils = require('../utils/writer.js')
var Results = require('../service/ResultsService')

module.exports.deleteResults = function deleteResults (req, res, next) {
  var crawls = req.swagger.params['crawls'].value
  var query = req.swagger.params['query'].value
  Results.deleteResults(crawls, query)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getResultCount = function getResultCount (req, res, next) {
  var crawls = req.swagger.params['crawls'].value
  var query = req.swagger.params['query'].value
  Results.getResultCount(crawls, query)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.getResults = function getResults (req, res, next) {
  var crawls = req.swagger.params['crawls'].value
  var query = req.swagger.params['query'].value
  var maxResults = req.swagger.params['maxResults'].value
  var page = req.swagger.params['page'].value
  var format = req.swagger.params['format'].value
  var download = req.swagger.params['download'].value
  Results.getResults(crawls, query, maxResults, page, format, download)
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}

module.exports.handlePreflight3 = function handlePreflight3 (req, res, next) {
  Results.handlePreflight3()
    .then(function (response) {
      utils.writeJson(res, response)
    })
    .catch(function (response) {
      utils.writeJson(res, response)
    })
}
