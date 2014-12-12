'use strict';

var ConnStrategyBlueMixRedisCloud, redis;

redis = require('redis');

ConnStrategyBlueMixRedisCloud = (function() {

  function ConnStrategyBlueMixRedisCloud() {}

  ConnStrategyBlueMixRedisCloud.prototype.getClient = function(config) {
    var credentials, env, redisHost, redisOptions, redisPort, redisVersion;
    this.config = config;
    if (process.env.VCAP_SERVICES) {
      env = JSON.parse(process.env.VCAP_SERVICES);
      redisVersion = this.config.redis_version || 'redis-2.6';
      credentials = env[redisVersion][0].credentials;
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

  return ConnStrategyBlueMixRedisCloud;

})();

module.exports = new ConnStrategyBlueMixRedisCloud;
