'use strict'

var { writeJson, respondWithCode } = require('../utils/writer')
var Results = require('../service/ResultsService')

module.exports.deleteResults = function deleteResults (req, res, next) {
  var crawls = req.swagger.params['crawls'].value
  var query = req.swagger.params['query'].value
  Results.deleteResults(crawls, query)
    .then(function (response) {
      writeJson(res, response)
    })
    .catch(function (err) {
      writeJson(res, respondWithCode(500, err.message))
    })
}

module.exports.getResultCount = function getResultCount (req, res, next) {
  var crawls = req.swagger.params['crawls'].value
  var query = req.swagger.params['query'].value
  Results.getResultCount(crawls, query)
    .then(function (response) {
      writeJson(res, respondWithCode(200, response))
    })
    .catch(function (err) {
      writeJson(res, respondWithCode(500, err.message))
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
      writeJson(res, response)
    })
    .catch(function (err) {
      writeJson(res, respondWithCode(500, err.message))
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
