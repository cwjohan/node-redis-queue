'use strict'

getConfig = (configFile = '../redis-queue-config.json') ->
  config = require configFile
  console.log 'config = ', config if config.verbose
  unless config.redis_provider
    throw new Error 'Missing "redis_provider" config parameter'
  return config

exports.getClient = (configFilePath) ->
  configFilePath = process.env.QUEUE_CONFIG_FILE or
                   configFilePath or
                   '../redis-queue-config.json'
  config = getConfig(configFilePath)
  strategy = require './connStrategy' + config.redis_provider.type
  return strategy.getClient config

