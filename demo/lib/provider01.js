'use strict';

var RedisQueue, clearInitially, enqueueURLs, initEventHandlers, main, myQueue, stopWorker, urlQueueName, urls;

RedisQueue = require('../../../node-redis-queue');

urlQueueName = 'urlq';

myQueue = null;

clearInitially = process.argv[2] === 'clear';

stopWorker = process.argv[2] === 'stop';

urls = ['http://www.google.com', 'http://www.yahoo.com', 'http://ourfamilystory.com', 'http://ourfamilystory.com/pnuke'];

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
  return myQueue.on('error', function(error) {
    console.log('provider01 stopping due to: ' + error);
    return process.exit();
  });
};

main = function() {
  if (clearInitially) {
    return myQueue.clear(urlQueueName, function() {
      console.log('Cleared "' + urlQueueName + '"');
      enqueueURLs();
      return myQueue.disconnect();
    });
  } else {
    if (!stopWorker) {
      enqueueURLs();
    } else {
      console.log('Stopping worker');
      myQueue.push(urlQueueName, '***stop***');
    }
    return myQueue.disconnect();
  }
};

enqueueURLs = function() {
  var url, _i, _len;
  for (_i = 0, _len = urls.length; _i < _len; _i++) {
    url = urls[_i];
    console.log('Pushing "' + url + '" to queue "' + urlQueueName + '"');
    myQueue.push(urlQueueName, url);
  }
};
