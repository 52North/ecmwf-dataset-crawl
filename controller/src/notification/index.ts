import cfg from '../config'
import Crawl from '../models/Crawl'

/**
 * implementation classes must inherit from this base class
 */
export abstract class NotificationApi {
  options: NotificationApiConfig

  constructor (options: NotificationApiConfig) {
    this.options = options
  }

  // async setup like authentication etcpp
  abstract async init (): Promise<any>

  abstract async sendNotification (topic: string, text: string, to?: Recipient[]): Promise<any>

  async sendCrawlComplete (crawl: Crawl, to: Recipient[]) {
    const topic = `Crawl ${crawl.name} has completed!`
    const text = `View the results at http://${cfg.frontendHost}/#/?crawls=${crawl.id}`
    return this.sendNotification(topic, text, to)
  }
}

type Recipient = string

type NotificationApiConfig = { }
