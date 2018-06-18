const CsvParser = require('json2csv').Parser

var ResponsePayload = function (code, payload) {
  this.code = code
  this.payload = payload
}

exports.respondWithCode = function (code, payload) {
  return new ResponsePayload(code, payload)
}

exports.writeCsv = function (response, arg1, arg2) {
  let { code, payload } = getCodeNPayload(arg1, arg2)
  // payload = csv(flatten(payload))
  const parser = new CsvParser({
    flatten: true,
  })
  payload = parser.parse(payload)
  response.writeHead(code, {'Content-Type': 'text/csv'})
  response.end(payload)
}

exports.writeJson = function (response, arg1, arg2) {
  let { code, payload } = getCodeNPayload(arg1, arg2)
  if (typeof payload === 'object') {
    payload = JSON.stringify(payload, null, 2)
  }
  response.writeHead(code, {'Content-Type': 'application/json'})
  response.end(payload)
}

function getCodeNPayload (arg1, arg2) {
  if (arg1 && arg1 instanceof ResponsePayload) {
    const { payload, code } = arg1
    return getCodeNPayload(payload, code)
  }

  let code
  let payload

  if (arg2 && Number.isInteger(arg2)) {
    code = arg2
  } else if (arg1 && Number.isInteger(arg1)) {
    code = arg1
  }
  if (code && arg1) {
    payload = arg1
  } else if (arg1) {
    payload = arg1
  }

  if (!code) {
    // if no response code given, we default to 200
    code = 200
  }

  return { code, payload }
}
