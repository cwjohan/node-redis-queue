'use strict';

var ConnStrategyCustom, redis;

redis = require('redis');

ConnStrategyCustom = (function() {

  function ConnStrategyCustom() {}

  ConnStrategyCustom.prototype.getClient = function(config) {
    var redisHost, redisOptions, redisPass, redisPort;
    this.config = config;
    redisPort = this.config.redis_provider.port;
    redisHost = this.config.redis_provider.host;
    redisPass = this.config.redis_provider.pass;
    redisOptions = this.config.redis_options;
    this.client = redis.createClient(redisPort, redisHost, redisOptions);
    this.client.auth(redisPass);
    return this.client;
  };

  return ConnStrategyCustom;

})();

module.exports = new ConnStrategyCustom;
