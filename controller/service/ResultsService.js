'use strict';


/**
 * Deletes crawl results based on filter
 * 
 *
 * crawls String Crawl IDs to filter results (optional)
 * query String Elastic Search query term to filter results (optional)
 * returns inline_response_200
 **/
exports.deleteResults = function(crawls,query) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "deleted" : 0
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Get crawl results with optional filtering
 * 
 *
 * crawls String Crawl IDs to filter results (optional)
 * query String Elastic Search query term to filter results (optional)
 * returns List
 **/
exports.getResults = function(crawls,query) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ {
  "metadata" : {
    "contact" : "contact"
  },
  "scores" : {
    "dataportal" : 6.02745618307040320615897144307382404804229736328125,
    "dataset" : 0.80082819046101150206595775671303272247314453125
  },
  "url" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
  "crawl" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91"
}, {
  "metadata" : {
    "contact" : "contact"
  },
  "scores" : {
    "dataportal" : 6.02745618307040320615897144307382404804229736328125,
    "dataset" : 0.80082819046101150206595775671303272247314453125
  },
  "url" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
  "crawl" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91"
} ];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}

