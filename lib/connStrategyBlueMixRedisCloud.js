'use strict';

var ConnStrategyCustom, redis;

redis = require('redis');

ConnStrategyCustom = (function() {

  function ConnStrategyCustom() {}

  ConnStrategyCustom.prototype.getClient = function(config) {
    var credentials, env, redisHost, redisOptions, redisPort;
    this.config = config;
    if (process.env.VCAP_SERVICES) {
      env = JSON.parse(process.env.VCAP_SERVICES);
      credentials = env['redis-2.6'][0].credentials;
      redisOptions = this.config.redis_options;
      this.client = redis.createClient(credentials.port, credentials.host, redisOptions);
      if (credentials.password) {
        this.client.auth(credentials.password);
      }
      return this.client;
    } else {
      console.log('VCAP_SERVICES environment variable not set. Assume local redis server');
      redisPort = 6379;
      redisHost = '127.0.0.1';
      redisOptions = this.config.redis_options;
      this.client = redis.createClient(redisPort, redisHost, redisOptions);
      return this.client;
    }
  };

  return ConnStrategyCustom;

})();

module.exports = new ConnStrategyCustom;
