'use strict'
const merge = require('webpack-merge')
const prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  host: '0.0.0.0',
  NODE_ENV: '"development"',
  API_URL: process.env.API_URL
    ? `"${process.env.API_URL}"`
    : '"http://localhost:9000"',
})
