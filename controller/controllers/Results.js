'use strict';

var utils = require('../utils/writer.js');
var Results = require('../service/ResultsService');

module.exports.deleteResults = function deleteResults (req, res, next) {
  var crawls = req.swagger.params['crawls'].value;
  var query = req.swagger.params['query'].value;
  Results.deleteResults(crawls,query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getResults = function getResults (req, res, next) {
  var crawls = req.swagger.params['crawls'].value;
  var query = req.swagger.params['query'].value;
  Results.getResults(crawls,query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
