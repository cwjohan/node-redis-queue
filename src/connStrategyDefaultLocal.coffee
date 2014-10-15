'use strict'
redis = require 'redis'

class ConnStrategyDefaultLocal
  getClient: (@config) ->
    redisPort = 6379
    redisHost = '127.0.0.1'
    redisOptions = @config.redis_options
    @client = redis.createClient redisPort, redisHost, redisOptions
    return @client

module.exports = new ConnStrategyDefaultLocal
