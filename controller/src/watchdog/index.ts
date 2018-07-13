import { setInterval, clearInterval } from 'timers'

import { getCrawls } from '../elastic'
import createLogger from '../logging'
import Crawl from '../models/Crawl'

const log = createLogger('watchdog')

/**
 * this watchdog visits all crawls periodically, and stops them if a condition is met.
 * he is a good boy.
 *
 * on each patrol he..
 * - bark()s at all crawls:
 *     checks wether they should be stopped
 * - bite()s crawls that look like a mailman
 *     the crawls will be stopped by deleting their status index in ES
 */
export default class CrawlWatchdog {
  private watchInterval: NodeJS.Timer | undefined
  private interval: number

  constructor (config: any) {
    this.interval = config.watchdog.checkInterval
    if (!this.interval) throw new Error('no check interval provided in config')
  }

  public patrol (): void {
    if (this.watchInterval) return
    this.watchInterval = setInterval(this.watchRoutine.bind(this), this.interval * 1000)
    log.info('crawl watchdog started')
    this.watchRoutine()
  }

  public sleep (): void {
    if (!this.watchInterval)
      return log.warn('this dog is already asleep')

    clearInterval(this.watchInterval)
    this.watchInterval = undefined
  }

  public boop (what: string): void {
    log.trace(`you booped the ${what}. such a good boy!`)
  }

  private watchRoutine (): void {
    // poll crawls from elastic
    log.debug('start checking crawl termination conditions')
    getCrawls()
    // check termination condition
      .then((crawls: Crawl[]) => Promise.all(crawls.map(this.bark)))
    // terminate if condition is met
      .then(checkResults => checkResults.filter(r => r.shouldTerminate))
      .then(checkResults => Promise.all(checkResults.map(r => this.bite(r.crawl))))
      .then(() => this.boop('snoot'))
      .catch(err => {
        log.error({ err }, 'error checking crawl termination condition or stopping crawl!')
      })
  }

  private async bark (crawl: Crawl): Promise<{ shouldTerminate: boolean, crawl: Crawl }> {
    let shouldTerminate = false

    if (crawl.started && !crawl.completed) {
      const { duration, resultCount } = crawl.crawlOptions.terminationCondition

      if (duration) {
        const secondsRunning = (Date.now() - new Date(crawl.started).getTime()) / 1000
        shouldTerminate = secondsRunning >= duration * 60
      }

      if (!shouldTerminate && resultCount) {
        const results = await crawl.getResultCount()
        shouldTerminate = results >= resultCount
      }
    }

    return { shouldTerminate, crawl }
  }

  private async bite (crawl: Crawl): Promise<void> {
    log.info({ crawlId: crawl.id }, 'stopping crawl due to termination condition')
    await crawl.stopCrawling()
  }
}
