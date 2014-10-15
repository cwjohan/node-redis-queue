'use strict';

/*
WorkQueueBroker Example -- provider04

For each URL in the urls list, this app puts a work request in 'urlq' queue to be
consumed by worker04. It then waits for the results to be returned in 'urlshaq01'
or whatever result queue, depending on the providerId parameter.

Usage:
    cd demo/lib
    export NODE_PATH='../../..'
    node provider04.js <providerId> [clear]
  or
    node provider04.js stop

  where <providerId> is something to make this provider instance unique,
  such as "01", "02", "foo", "bar", or whatever.

Example usage:
  cd demo/lib
  export NODE_PATH='../../..'
  node provider04.js 01 clear
  node provider04.js
  node provider04.js
  node provider04.js stop

Use this app in conjunction with worker02.js. See the worker02 source code
for more details.
*/

var WorkQueueBroker, clearInitially, clearQueues, consumeResultQueue, createWorkQueues, initEventHandlers, myBroker, providerId, resultQueue, resultQueueName, resultQueueTimeout, resultsExpected, sendURLs, stopOneWorker, stopWorker, urlQueue, urlQueueName, urls;

WorkQueueBroker = require('node-redis-queue').WorkQueueBroker;

urlQueueName = 'urlq';

urlQueue = null;

resultQueue = null;

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

myBroker = new WorkQueueBroker();

myBroker.connect(function() {
  console.log('connected');
  initEventHandlers();
  createWorkQueues();
  if (stopWorker) {
    return stopOneWorker();
  } else if (clearInitially) {
    return clearQueues();
  } else {
    sendURLs();
    return consumeResultQueue();
  }
});

initEventHandlers = function() {
  myBroker.on('end', function() {
    console.log('provider04 finished');
    return process.exit();
  });
  return myBroker.on('error', function(error) {
    console.log('provider01 stopping due to: ' + error);
    return process.exit();
  });
};

createWorkQueues = function() {
  urlQueue = myBroker.createQueue(urlQueueName);
  return resultQueue = myBroker.createQueue(resultQueueName);
};

clearQueues = function() {
  return urlQueue.clear(function() {
    console.log('cleared "' + urlQueueName + '"');
    return resultQueue.clear(function() {
      console.log('cleared "' + resultQueueName + '"');
      return myBroker.disconnect();
    });
  });
};

sendURLs = function() {
  var url, _i, _len;
  if (!stopWorker) {
    for (_i = 0, _len = urls.length; _i < _len; _i++) {
      url = urls[_i];
      console.log('Publishing "' + url + '"');
      urlQueue.send({
        url: url,
        q: resultQueueName
      });
      ++resultsExpected;
    }
    return console.log('waiting for results from worker...');
  }
};

consumeResultQueue = function() {
  return resultQueue.consume(function(result, ack) {
    console.log('result = ', result);
    ack();
    if (!--resultsExpected) {
      return myBroker.end();
    }
  });
};

stopOneWorker = function() {
  console.log('Stopping worker');
  urlQueue.send('***stop***');
  return myBroker.disconnect();
};
