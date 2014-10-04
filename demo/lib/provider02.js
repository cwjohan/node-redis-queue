'use strict';

var RedisQueue, clearInitially, myQueue, providerId, queueURLs, resultCnt, resultQueueName, resultQueueTimeout, stopWorker, urlQueueName, urls;

RedisQueue = require('../../../node-redis-queue');

urlQueueName = 'urlq';

providerId = process.argv[2];

if (!providerId) {
  console.log('Missing provider id argument');
  process.exit();
}

resultQueueName = 'urlshaq' + providerId;

resultQueueTimeout = 1;

clearInitially = process.argv[3] === 'clear';

stopWorker = process.argv[2] === 'stop';

urls = ['http://www.google.com', 'http://www.yahoo.com', 'http://ourfamilystory.com', 'http://ourfamilystory.com/pnuke'];

resultCnt = 0;

myQueue = new RedisQueue;

myQueue.connect();

myQueue.on('end', function() {
  console.log('provider01 finished');
  return process.exit();
});

myQueue.on('error', function(error) {
  console.log('provider01 stopping due to: ' + error);
  return process.exit();
});

myQueue.on('message', function(queueName, result) {
  console.log('result = ', result);
  if (++resultCnt >= urls.length) {
    return myQueue.disconnect();
  }
});

queueURLs = function() {
  var url, _i, _len;
  for (_i = 0, _len = urls.length; _i < _len; _i++) {
    url = urls[_i];
    console.log('Pushing "' + url + '"');
    myQueue.push(urlQueueName, {
      url: url,
      q: resultQueueName
    });
  }
};

if (stopWorker) {
  console.log('Stopping worker');
  myQueue.push(urlQueueName, '***stop***');
  myQueue.disconnect();
} else {
  if (clearInitially) {
    myQueue.clear(urlQueueName, function() {
      console.log('Cleared "' + urlQueueName + '"');
      queueURLs();
    });
  } else {
    queueURLs();
  }
}

myQueue.monitor(resultQueueTimeout, resultQueueName);
