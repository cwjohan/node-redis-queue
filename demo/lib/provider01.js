'use strict';

/*
Channel Example -- provider01

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

var Channel, channel, clearInitially, enqueueURLs, initEventHandlers, main, stopWorker, urlQueueName, urls;

Channel = require('node-redis-queue').Channel;

urlQueueName = 'urlq';

channel = null;

clearInitially = process.argv[2] === 'clear';

stopWorker = process.argv[2] === 'stop';

urls = ['http://www.google.com', 'http://www.yahoo.com', 'http://www.google.com/robots.txt', 'https://code.google.com'];

channel = new Channel();

channel.connect(function() {
  console.log('connected');
  initEventHandlers();
  return main();
});

initEventHandlers = function() {
  return channel.on('end', function() {
    console.log('provider01 finished');
    return process.exit();
  }).on('error', function(error) {
    console.log('provider01 stopping due to: ' + error);
    return process.exit();
  });
};

main = function() {
  if (clearInitially) {
    return channel.clear(urlQueueName, function() {
      console.log('Cleared "' + urlQueueName + '"');
      enqueueURLs();
      return channel.disconnect();
    });
  } else {
    if (!stopWorker) {
      enqueueURLs();
    } else {
      console.log('Stopping worker');
      channel.push(urlQueueName, '***stop***');
    }
    return channel.disconnect();
  }
};

enqueueURLs = function() {
  var url, _i, _len;
  for (_i = 0, _len = urls.length; _i < _len; _i++) {
    url = urls[_i];
    console.log('Pushing "' + url + '" to queue "' + urlQueueName + '"');
    channel.push(urlQueueName, url);
  }
};
