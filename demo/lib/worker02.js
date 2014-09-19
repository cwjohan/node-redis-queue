'use strict';

var RedisQueue, SHA1, myQueue, redis, redisConn, redisHost, redisPort, redisQueueName, redisQueueTimeout, request;

SHA1 = require('../lib/helpers/tinySHA1.r4.js').SHA1;

request = require('request');

redis = require('redis');

RedisQueue = require('../../../node-redis-queue');

redisPort = 6379;

redisHost = '127.0.0.1';

redisQueueName = 'urlq';

redisQueueTimeout = 4;

redisConn = null;

myQueue = null;

redisConn = redis.createClient(redisPort, redisHost);

myQueue = new RedisQueue(redisConn, redisQueueTimeout);

myQueue.on('end', function() {
  console.log('worker01 detected Redis connection ended');
  return process.exit();
});

myQueue.on('error', function(error) {
  console.log('worker01 stopping due to: ' + error);
  return process.exit();
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
