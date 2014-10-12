'use strict';

var RedisQueue, clearInitially, enqueueURLs, initEventHandlers, main, myQueue, providerId, resultQueueName, resultQueueTimeout, resultsExpected, stopWorker, urlQueueName, urls;

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

resultsExpected = 0;

myQueue = new RedisQueue;

myQueue.connect(function() {
  console.log('connected');
  initEventHandlers();
  return main();
});

initEventHandlers = function() {
  myQueue.on('end', function() {
    console.log('provider01 finished');
    return process.exit();
  });
  myQueue.on('error', function(error) {
    console.log('provider01 stopping due to: ' + error);
    return process.exit();
  });
  return myQueue.on('message', function(queueName, result) {
    console.log('result = ', result);
    if (!--resultsExpected) {
      return myQueue.disconnect();
    }
  });
};

main = function() {
  if (clearInitially) {
    return myQueue.clear(urlQueueName, function() {
      console.log('Cleared "' + urlQueueName + '"');
      return myQueue.clear(resultQueueName, function() {
        console.log('Cleared "' + resultQueueName + '"');
        return myQueue.disconnect();
      });
    });
  } else {
    if (!stopWorker) {
      return enqueueURLs();
    } else {
      console.log('Stopping worker');
      myQueue.push(urlQueueName, '***stop***');
      return myQueue.disconnect();
    }
  }
};

enqueueURLs = function() {
  var url, _i, _len;
  for (_i = 0, _len = urls.length; _i < _len; _i++) {
    url = urls[_i];
    console.log('Pushing "' + url + '"');
    myQueue.push(urlQueueName, {
      url: url,
      q: resultQueueName
    });
    ++resultsExpected;
  }
  myQueue.monitor(resultQueueTimeout, resultQueueName);
  return console.log('waiting for responses from worker...');
};
