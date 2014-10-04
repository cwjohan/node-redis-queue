'use strict';

var fs;

fs = require('fs');

exports.getConfig = function(configFile) {
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

exports.getClient = function(config) {
  var strategy;
  strategy = require('./connStrategy' + config.redis_provider.type);
  return strategy.getClient(config);
};
