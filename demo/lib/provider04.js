'use strict';

var WorkQueueBroker, clearInitially, clearQueues, createWorkQueues, initEventHandlers, myBroker, providerId, publishURLs, resultQueue, resultQueueName, resultQueueTimeout, resultsExpected, stopOneWorker, stopWorker, subscribeToUrlQueue, urlQueue, urlQueueName, urls;

WorkQueueBroker = require('../../lib/workQueueBroker');

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
    subscribeToUrlQueue();
    return publishURLs();
  }
});

initEventHandlers = function() {
  myBroker.on('end', function() {
    console.log('provider01 finished');
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

subscribeToUrlQueue = function() {
  return resultQueue.subscribe(function(result, ack) {
    console.log('result = ', result);
    ack();
    if (!--resultsExpected) {
      return myBroker.end();
    }
  });
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

publishURLs = function() {
  var url, _i, _len;
  if (!stopWorker) {
    for (_i = 0, _len = urls.length; _i < _len; _i++) {
      url = urls[_i];
      console.log('Publishing "' + url + '"');
      urlQueue.publish({
        url: url,
        q: resultQueueName
      });
      ++resultsExpected;
    }
    return console.log('waiting for results from worker...');
  }
};

stopOneWorker = function() {
  console.log('Stopping worker');
  urlQueue.publish('***stop***');
  return myBroker.disconnect();
};
