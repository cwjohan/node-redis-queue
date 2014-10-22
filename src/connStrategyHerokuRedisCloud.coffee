'use strict'
redis = require 'redis'
url = require 'url'

class ConnStrategyHerokuRedisCloud
  getClient: (@config) ->
    if process.env.REDISCLOUD_URL
      redisURL = url.parse process.env.REDISCLOUD_URL
      redisPass = redisURL.auth.split(':')[1]
      redisOptions = @config.redis_options
      @client = redis.createClient redisURL.port, redisURL.hostname, redisOptions
      @client.auth redisPass if redisPass
      return @client
    else
      console.log 'REDISCLOUD_URL environment variable not set. Assume local redis-server.'
      redisPort = 6379
      redisHost = '127.0.0.1'
      redisOptions = @config.redis_options
      @client = redis.createClient redisPort, redisHost, redisOptions
      return @client

module.exports = new ConnStrategyHerokuRedisCloud
