'use strict';

/*
QueueMgr Example -- provider01

For each URL in the urls list, this app pushes it into the 'urlq' queue
for consumption by worker01. When done with that, it quits.

Usage:
  cd demo/lib
  export NODE_PATH='../../..'
  node provider01.js clear
  node provider01.js
  ...
  node provider01.js stop

Use this app in conjunction with worker01.js. See the worker01 source code
for more details.
*/

var QueueMgr, clearInitially, enqueueURLs, initEventHandlers, main, qmgr, stopWorker, urlQueueName, urls;

QueueMgr = require('node-redis-queue').QueueMgr;

urlQueueName = 'urlq';

qmgr = null;

clearInitially = process.argv[2] === 'clear';

stopWorker = process.argv[2] === 'stop';

urls = ['http://www.google.com', 'http://www.yahoo.com', 'http://ourfamilystory.com', 'http://ourfamilystory.com/pnuke'];

qmgr = new QueueMgr;

qmgr.connect(function() {
  console.log('connected');
  initEventHandlers();
  return main();
});

initEventHandlers = function() {
  return qmgr.on('end', function() {
    console.log('provider01 finished');
    return process.exit();
  }).on('error', function(error) {
    console.log('provider01 stopping due to: ' + error);
    return process.exit();
  });
};

main = function() {
  if (clearInitially) {
    return qmgr.clear(urlQueueName, function() {
      console.log('Cleared "' + urlQueueName + '"');
      enqueueURLs();
      return qmgr.disconnect();
    });
  } else {
    if (!stopWorker) {
      enqueueURLs();
    } else {
      console.log('Stopping worker');
      qmgr.push(urlQueueName, '***stop***');
    }
    return qmgr.disconnect();
  }
};

enqueueURLs = function() {
  var url, _i, _len;
  for (_i = 0, _len = urls.length; _i < _len; _i++) {
    url = urls[_i];
    console.log('Pushing "' + url + '" to queue "' + urlQueueName + '"');
    qmgr.push(urlQueueName, url);
  }
};
