'use strict';

var RedisQueue, clearInitially, myQueue, queueURLs, stopWorker, urlQueueName, urls;

RedisQueue = require('../../../node-redis-queue');

urlQueueName = 'urlq';

myQueue = null;

clearInitially = process.argv[2] === 'clear';

stopWorker = process.argv[2] === 'stop';

urls = ['http://www.google.com', 'http://www.yahoo.com', 'http://ourfamilystory.com', 'http://ourfamilystory.com/pnuke'];

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

queueURLs = function() {
  var url, _i, _len;
  for (_i = 0, _len = urls.length; _i < _len; _i++) {
    url = urls[_i];
    console.log('Pushing "' + url + '"');
    myQueue.push(urlQueueName, url);
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
      myQueue.disconnect();
    });
  } else {
    queueURLs();
    myQueue.disconnect();
  }
}
