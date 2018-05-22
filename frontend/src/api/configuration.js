export default class Configuration {
  constructor (param = {}) {
    this.apiKey = param.apiKey
    this.username = param.username
    this.password = param.password
    this.accessToken = param.accessToken
    this.basePath = param.basePath
  }
}
