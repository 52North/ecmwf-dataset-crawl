'use strict'

const crawlStore = [
  {
    "languages": [
      "string"
    ],
    "keywordGroups": [
      {
        "keywords": [
          "keywords",
          "keywords"
        ],
        "translate": true
      }
    ],
    "domainBlacklist": [
      "string"
    ],
    "domainWhitelist": [
      "string"
    ],
    "crawlOptions": {
      "recursion": 4,
      "seedUrlsPerKeywordGroup": 10,
    },
    "id": "1",
    "name": "Crawl Numero Eins",
    "started": "2018-05-22T10:27:31.710Z",
    "completed": "2018-05-22T10:27:31.710Z",
    "seedUrls": [
      "string"
    ],
    "resultCount": 124,
  }
]


/**
 * Add a new Crawl
 *
 * crawl CrawlRequest
 * returns CrawlResponse
 **/
exports.addCrawl = function (crawl) {
  console.log(JSON.stringify(crawl, null, 2))
  return new Promise(function (resolve, reject) {
    crawlStore.push(crawl)

    var examples = {}
    examples['application/json'] = crawl
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
    examples['application/json'] = crawlStore
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]])
    } else {
      resolve()
    }
  })
}

/**
 * Only defined to handle preflight CORS requests
 *
 * no response value expected for this operation
 **/
exports.handlePreflight = function () {
  return new Promise(function (resolve, reject) {
    resolve()
  })
}

/**
 * Only defined to handle preflight CORS requests
 *
 * crawlId String Crawl ID to operate on
 * no response value expected for this operation
 **/
exports.handlePreflight2 = function (crawlId) {
  return new Promise(function (resolve, reject) {
    resolve()
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
