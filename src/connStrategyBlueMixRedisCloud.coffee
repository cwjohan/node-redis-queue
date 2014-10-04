'use strict'
redis = require 'redis'

class ConnStrategyCustom
  getClient: (@config) ->
    if process.env.VCAP_SERVICES
      env = JSON.parse process.env.VCAP_SERVICES
      credentials = env['redis-2.6'][0].credentials
      redisOptions = @config.redis_options
      @client = redis.createClient credentials.port, credentials.host, redisOptions
      @client.auth credentials.password if credentials.password
      return @client
    else
      console.log 'VCAP_SERVICES environment variable not set'
      throw Error 'Undefined VCAP_SERVICES'

module.exports = new ConnStrategyCustom
