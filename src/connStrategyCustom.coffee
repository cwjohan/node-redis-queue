'use strict'
redis = require 'redis'

class ConnStrategyCustom
  getClient: (@config) ->
    redisPort = @config.redis_provider.port
    redisHost = @config.redis_provider.host
    redisPass = @config.redis_provider.pass
    redisOptions = @config.redis_options
    @client = redis.createClient redisPort, redisHost, redisOptions
    @client.auth redisPass if redisPass
    return @client

module.exports = new ConnStrategyCustom
