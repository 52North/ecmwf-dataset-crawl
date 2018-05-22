'use strict'

module.exports = {
  isDev: process.env.NODE_ENV === 'development',
  apiPort: process.env.API_PORT || 9000,
}
