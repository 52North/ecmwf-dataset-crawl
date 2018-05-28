import {
  createLogger as bunyan,
  stdSerializers,
  LogLevel,
  LoggerOptions
} from 'bunyan'

import cfg from './config'

const logger = bunyan({
  name: 'crawl-controller',
  level: cfg.loglevel as LogLevel,
  serializers: {
    req: stdSerializers.req,
    res: stdSerializers.res,
    err: stdSerializers.err,
  }
})

export default function createLogger (component: string, options?: LoggerOptions) {
  return logger.child(Object.assign({ component }, options))
}
