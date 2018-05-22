'use strict'

/**
 * Add a new Crawl
 *
 * crawl CrawlRequest
 * returns CrawlResponse
 **/
exports.addCrawl = function (crawl) {
  return new Promise(function (resolve, reject) {
    var examples = {}
    examples['application/json'] = ''
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]])
    } else {
      resolve()
    }
  })
}

/**
 * Get a Crawl
 *
 * crawlId String Crawl ID to operate on
 * returns CrawlResponse
 **/
exports.getCrawl = function (crawlId) {
  return new Promise(function (resolve, reject) {
    var examples = {}
    examples['application/json'] = ''
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]])
    } else {
      resolve()
    }
  })
}

/**
 * Get all Crawls
 *
 * returns List
 **/
exports.getCrawls = function () {
  return new Promise(function (resolve, reject) {
    var examples = {}
    examples['application/json'] = [ '', '' ]
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]])
    } else {
      resolve()
    }
  })
}

/**
 * Stop a Crawl
 *
 * crawlId String Crawl ID to operate on
 * no response value expected for this operation
 **/
exports.stopCrawl = function (crawlId) {
  return new Promise(function (resolve, reject) {
    resolve()
  })
}
