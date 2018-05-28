import { ConfigOptions } from 'elasticsearch'
import Logger from 'bunyan'

import createLogger from '../logging'

export default class LogToBunyan {
  bun: Logger
  error: (error: Error, ...params: any[]) => void
  warning: (error: Error, ...params: any[]) => void
  info: (error: Error, ...params: any[]) => void
  debug: (error: Error, ...params: any[]) => void

  constructor (config: ConfigOptions) {
    const bun = this.bun = createLogger('elasticsearch')
    this.error = bun.error.bind(bun)
    this.warning = bun.warn.bind(bun)
    this.info = bun.info.bind(bun)
    this.debug = bun.debug.bind(bun)
  }

  // @ts-ignore
  trace (method, requestUrl, body, responseBody, responseStatus) {
    this.bun.trace({
      method: method,
      requestUrl: requestUrl,
      body: body,
      responseBody: responseBody,
      responseStatus: responseStatus
    })
  }

  close () { /* bunyan's loggers do not need to be closed */ }
}
