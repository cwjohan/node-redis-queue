'use strict';

var getConfig;

getConfig = function(configFile) {
  var config;
  if (configFile == null) {
    configFile = '../redis-queue-config.json';
  }
  config = require(configFile);
  if (config.verbose) {
    console.log('config = ', config);
  }
  if (!config.redis_provider) {
    throw new Error('Missing "redis_provider" config parameter');
  }
  return config;
};

exports.getClient = function(configFilePath) {
  var config, strategy;
  configFilePath = process.env.QUEUE_CONFIG_FILE || configFilePath || '../redis-queue-config.json';
  config = getConfig(configFilePath);
  strategy = require('./connStrategy' + config.redis_provider.type);
  return strategy.getClient(config);
};
