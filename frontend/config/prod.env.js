'use strict'
module.exports = {
  NODE_ENV: '"production"',
  API_URL: process.env.API_URL
    ? `"${process.env.API_URL}"`
    : '"/api"',
  KIBANA_URL: process.env.KIBANA_URL
    ? `"${process.env.KIBANA_URL}"`
    : '"/kibana"',
}
