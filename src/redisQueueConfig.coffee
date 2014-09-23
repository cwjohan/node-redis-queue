'use strict'
fs = require 'fs'

exports.getConfig = (configFile = 'redis-queue-config.json') ->
  unless fs.existsSync configFile
    throw new Error 'File "' + configFile + '" does not exist'
  config = require '../' + configFile
  console.log 'config = ', config if config.verbose
  unless config.redis_provider
    throw new Error 'Missing "redis_provider" config parameter'
  return config

exports.getClient = (config) ->
  strategy = require './connStrategy' + config.redis_provider.type
  return strategy.getClient(config)

