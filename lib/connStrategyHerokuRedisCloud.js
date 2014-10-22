'use strict';

var ConnStrategyHerokuRedisCloud, redis, url;

redis = require('redis');

url = require('url');

ConnStrategyHerokuRedisCloud = (function() {

  function ConnStrategyHerokuRedisCloud() {}

  ConnStrategyHerokuRedisCloud.prototype.getClient = function(config) {
    var redisHost, redisOptions, redisPass, redisPort, redisURL;
    this.config = config;
    if (process.env.REDISCLOUD_URL) {
      redisURL = url.parse(process.env.REDISCLOUD_URL);
      redisPass = redisURL.auth.split(':')[1];
      redisOptions = this.config.redis_options;
      this.client = redis.createClient(redisURL.port, redisURL.hostname, redisOptions);
      if (redisPass) {
        this.client.auth(redisPass);
      }
      return this.client;
    } else {
      console.log('REDISCLOUD_URL environment variable not set. Assume local redis-server.');
      redisPort = 6379;
      redisHost = '127.0.0.1';
      redisOptions = this.config.redis_options;
      this.client = redis.createClient(redisPort, redisHost, redisOptions);
      return this.client;
    }
  };

  return ConnStrategyHerokuRedisCloud;

})();

module.exports = new ConnStrategyHerokuRedisCloud;
