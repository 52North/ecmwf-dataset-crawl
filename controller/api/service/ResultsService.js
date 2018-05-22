'use strict'

/**
 * Deletes crawl results based on filter
 *
 *
 * crawls String Crawl IDs to filter results (optional)
 * query String Elastic Search query term to filter results (optional)
 * returns DeleteResponse
 **/
exports.deleteResults = function (crawls, query) {
  return new Promise(function (resolve, reject) {
    var examples = {}
    examples['application/json'] = {
      'deleted': 0
    }
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]])
    } else {
      resolve()
    }
  })
}

/**
 * Get count of crawl results with optional filtering
 *
 *
 * crawls String Crawl IDs to filter results (optional)
 * query String Elastic Search query term to filter results (optional)
 * returns Integer
 **/
exports.getResultCount = function (crawls, query) {
  return new Promise(function (resolve, reject) {
    var examples = {}
    examples['application/json'] = {
      count: 1234
    }
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]])
    } else {
      resolve()
    }
  })
}

/**
 * Get crawl results with optional filtering
 *
 *
 * crawls String Crawl IDs to filter results (optional)
 * query String Elastic Search query term to filter results (optional)
 * maxResults Integer The amount of results to return (optional)
 * page Integer To page through the results (optional)
 * format String Format in which results are returned (optional)
 * download Boolean Whether to send an attachment header (optional)
 * returns List
 **/
exports.getResults = function (crawls, query, maxResults, page, format, download) {
  return new Promise(function (resolve, reject) {
    var examples = {}
    examples['application/json'] = [ {
      'metadata': {
        'contact': 'contact'
      },
      'scores': {
        'dataportal': 6.027456183070403,
        'dataset': 0.8008281904610115
      },
      'url': 'https://example.com/foobar',
      'crawl': '046b6c7f-0b8a-43b9-b35d-6489e6daee91'
    }, {
      'metadata': {
        'contact': 'contact'
      },
      'scores': {
        'dataportal': 6.027456183070403,
        'dataset': 0.8008281904610115
      },
      'url': 'https://example.com/foobar',
      'crawl': '046b6c7f-0b8a-43b9-b35d-6489e6daee91'
    } ]
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]])
    } else {
      resolve()
    }
  })
}
