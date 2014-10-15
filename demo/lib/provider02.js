'use strict';

var QueueMgr, clearInitially, enqueueURLs, initEventHandlers, main, onData, providerId, qmgr, resultQueueName, resultQueueTimeout, resultsExpected, shutDown, stopWorker, urlQueueName, urls;

QueueMgr = require('node-redis-queue').QueueMgr;

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

qmgr = new QueueMgr;

qmgr.connect(function() {
  console.log('connected');
  initEventHandlers();
  return main();
});

initEventHandlers = function() {
  qmgr.on('end', function() {
    console.log('provider01 finished');
    return shutDown();
  });
  return qmgr.on('error', function(error) {
    console.log('provider01 stopping due to: ' + error);
    return shutDown();
  });
};

main = function() {
  if (clearInitially) {
    return qmgr.clear(urlQueueName, function() {
      console.log('Cleared "' + urlQueueName + '"');
      return qmgr.clear(resultQueueName, function() {
        console.log('Cleared "' + resultQueueName + '"');
        return shutDown();
      });
    });
  } else {
    if (!stopWorker) {
      return enqueueURLs();
    } else {
      console.log('Stopping worker');
      qmgr.push(urlQueueName, '***stop***');
      return shutDown();
    }
  }
};

enqueueURLs = function() {
  var url, _i, _len;
  for (_i = 0, _len = urls.length; _i < _len; _i++) {
    url = urls[_i];
    console.log('Pushing "' + url + '"');
    qmgr.push(urlQueueName, {
      url: url,
      q: resultQueueName
    });
    ++resultsExpected;
  }
  qmgr.pop(resultQueueName, onData);
  return console.log('waiting for responses from worker...');
};

onData = function(result) {
  console.log('result = ', result);
  if (--resultsExpected) {
    return qmgr.pop(resultQueueName, onData);
  } else {
    return shutDown();
  }
};

shutDown = function() {
  qmgr.end();
  return process.exit();
};
