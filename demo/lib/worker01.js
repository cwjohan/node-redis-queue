'use strict';

var RedisQueue, SHA1, config, configurator, memwatch, myQueue, redis, redisClient, redisQueueName, redisQueueTimeout, request;

SHA1 = require('../lib/helpers/tinySHA1.r4.js').SHA1;

request = require('request');

redis = require('redis');

RedisQueue = require('../../../node-redis-queue');

redisQueueName = 'urlq';

redisQueueTimeout = 1;

redisClient = null;

myQueue = null;

if (process.argv[2] === 'mem') {
  memwatch = require('memwatch');
  memwatch.on('stats', function(d) {
    return console.log('>>>current = ' + d.current_base + ', max = ' + d.max);
  });
  memwatch.on('leak', function(d) {
    return console.log('>>>LEAK = ', d);
  });
}

configurator = require('../../lib/redisQueueConfig');

config = configurator.getConfig();

redisClient = configurator.getClient(config);

myQueue = new RedisQueue(redisClient, redisQueueTimeout);

myQueue.on('end', function() {
  console.log('worker01 detected Redis connection ended');
  return process.exit();
});

myQueue.on('error', function(error) {
  console.log('worker01 stopping due to: ' + error);
  return process.exit();
});

myQueue.on('timeout', function() {
  return console.log('worker01 timeout');
});

myQueue.on('message', function(queueName, url) {
  console.log('worker01 processing URL "' + url + '"');
  if (url === '***stop***') {
    console.log('worker01 stopping');
    process.exit();
  }
  return request(url, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      return console.log(url + ' SHA1 = ' + SHA1(body));
    } else {
      return console.log(error);
    }
  });
});

myQueue.monitor(redisQueueName);
