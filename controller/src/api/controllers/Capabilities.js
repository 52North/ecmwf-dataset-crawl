'use strict'

var { writeJson, respondWithCode } = require('../utils/writer.js')
var Capabilities = require('../service/CapabilitiesService')

module.exports.getLanguages = function getLanguages (req, res, next) {
  Capabilities.getLanguages()
    .then(function (response) {
      writeJson(res, response)
    })
    .catch(function (err) {
      writeJson(res, respondWithCode(500, err.message))
    })
}

module.exports.getCountries = function getCountries (req, res, next) {
  Capabilities.getCountries()
    .then(function (response) {
      writeJson(res, response)
    })
    .catch(function (err) {
      writeJson(res, respondWithCode(500, err.message))
    })
}
