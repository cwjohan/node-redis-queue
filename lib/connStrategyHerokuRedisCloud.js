'use strict';

var ConnStrategyCustom, redis, url;

redis = require('redis');

url = require('url');

ConnStrategyCustom = (function() {

  function ConnStrategyCustom() {}

  ConnStrategyCustom.prototype.getClient = function(config) {
    var redisOptions, redisPass, redisURL;
    this.config = config;
    if (process.env.REDISCLOUD_URL) {
      redisURL = url.parse(process.env.REDISCLOUD_URL);
      redisPass = redisURL.auth.split(':')[1];
      redisOptions = this.config.redis_options;
      this.client = redis.createClient(redisURL.port, redisURL.host, redisOptions);
      if (redisPass) {
        this.client.auth(redisPass);
      }
      return this.client;
    } else {
      console.log('REDISCLOUD_URL environment variable not set');
      throw Error('Undefined REDISCLOUD_URL');
    }
  };

  return ConnStrategyCustom;

})();

module.exports = new ConnStrategyCustom;
