'use strict'

/**
 * Returns all available language codes for translation
 *
 * returns List
 **/
exports.getLanguages = function () {
  return new Promise(function (resolve, reject) {
    var examples = {}
    examples['application/json'] = [ {
      'code': 'de',
      'name': 'German'
    }, {
      'code': 'en',
      'name': 'English'
    } ]
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]])
    } else {
      resolve()
    }
  })
}
