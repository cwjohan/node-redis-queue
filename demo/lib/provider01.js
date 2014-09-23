'use strict';

var RedisQueue, clearInitially, config, configurator, myQueue, queueURLs, redis, redisClient, redisQueueName, redisQueueTimeout, stopWorker, urls;

redis = require('redis');

RedisQueue = require('../../../node-redis-queue');

redisQueueName = 'urlq';

redisQueueTimeout = 1;

redisClient = null;

myQueue = null;

clearInitially = process.argv[2] === 'clear';

stopWorker = process.argv[2] === 'stop';

urls = ['http://www.google.com', 'http://www.yahoo.com', 'http://ourfamilystory.com', 'http://ourfamilystory.com/pnuke'];

configurator = require('../../lib/redisQueueConfig');

config = configurator.getConfog();

redisClient = configurator.getClient(config);

myQueue = new RedisQueue(redisClient, redisQueueTimeout);

myQueue.on('end', function() {
  console.log('provider01 finished');
  return process.exit();
});

myQueue.on('error', function(error) {
  console.log('provider01 stopping due to: ' + error);
  return process.exit();
});

queueURLs = function() {
  var url, _i, _len;
  for (_i = 0, _len = urls.length; _i < _len; _i++) {
    url = urls[_i];
    console.log('Pushing "' + url);
    myQueue.push(redisQueueName, url);
  }
};

if (stopWorker) {
  console.log('Stopping worker');
  myQueue.push(redisQueueName, '***stop***');
} else {
  if (clearInitially) {
    myQueue.clear(redisQueueName, function() {
      console.log('Cleared "' + redisQueueName + '"');
      return queueURLs();
    });
  } else {
    queueURLs();
  }
}

redisClient.quit();
