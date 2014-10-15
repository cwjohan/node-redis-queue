'use strict';

var ConnStrategyDefaultLocal, redis;

redis = require('redis');

ConnStrategyDefaultLocal = (function() {

  function ConnStrategyDefaultLocal() {}

  ConnStrategyDefaultLocal.prototype.getClient = function(config) {
    var redisHost, redisOptions, redisPort;
    this.config = config;
    redisPort = 6379;
    redisHost = '127.0.0.1';
    redisOptions = this.config.redis_options;
    this.client = redis.createClient(redisPort, redisHost, redisOptions);
    return this.client;
  };

  return ConnStrategyDefaultLocal;

})();

module.exports = new ConnStrategyDefaultLocal;
