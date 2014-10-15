'use strict'
redis = require 'redis'
url = require 'url'

class ConnStrategyCustom
  getClient: (@config) ->
    if process.env.REDISCLOUD_URL
      redisURL = url.parse process.env.REDISCLOUD_URL
      redisPass = redisURL.auth.split(':')[1]
      redisOptions = @config.redis_options
      @client = redis.createClient redisURL.port, redisURL.host, redisOptions
      @client.auth redisPass if redisPass
      return @client
    else
      console.log 'REDISCLOUD_URL environment variable not set'
      throw Error('Undefined REDISCLOUD_URL')

module.exports = new ConnStrategyCustom
