'use strict';

/*
Channel Example -- provider02

For each URL in the urls list, this app puts a work request in 'urlq' queue
consumed by worker02 and waits for the results to be returned in 'urlshaq01'
or whatever, depending on the providerId parameter.

Usage:
   cd demo/lib
   export NODE_PATH='../../..'
   node provider02.js <providerId> [clear]
 or
   node provider02.js stop

 where <providerId> is something to make this provider instance unique,
 such as "01", "02", "foo", "bar", or whatever.

Example usage:
  cd demo/lib
  export NODE_PATH='../../..'
  node provider02.js 01 clear
  node provider02.js
  node provider02.js
  node provider02.js stop

Use this app in conjunction with worker02.js. See the worker02 source code
for more details.
*/

var Channel, channel, clearInitially, enqueueURLs, initEventHandlers, main, onData, providerId, resultQueueName, resultsExpected, shutDown, stopWorker, urlQueueName, urls;

Channel = require('node-redis-queue').Channel;

urlQueueName = 'urlq';

providerId = process.argv[2];

if (!providerId) {
  console.log('Missing provider id argument');
  process.exit();
}

resultQueueName = 'urlshaq' + providerId;

clearInitially = process.argv[3] === 'clear';

stopWorker = process.argv[2] === 'stop';

urls = ['http://www.google.com', 'http://www.yahoo.com', 'http://www.google.com/robots.txt', 'https://code.google.com'];

resultsExpected = 0;

channel = new Channel();

channel.connect(function() {
  console.log('connected');
  initEventHandlers();
  return main();
});

initEventHandlers = function() {
  channel.on('end', function() {
    console.log('provider01 finished');
    return shutDown();
  });
  return channel.on('error', function(error) {
    console.log('provider01 stopping due to: ' + error);
    return shutDown();
  });
};

main = function() {
  if (clearInitially) {
    return channel.clear(urlQueueName, function() {
      console.log('Cleared "' + urlQueueName + '"');
      return channel.clear(resultQueueName, function() {
        console.log('Cleared "' + resultQueueName + '"');
        return shutDown();
      });
    });
  } else {
    if (!stopWorker) {
      return enqueueURLs();
    } else {
      console.log('Stopping worker');
      channel.push(urlQueueName, '***stop***');
      return shutDown();
    }
  }
};

enqueueURLs = function() {
  var url, _i, _len;
  for (_i = 0, _len = urls.length; _i < _len; _i++) {
    url = urls[_i];
    console.log('Pushing "' + url + '"');
    channel.push(urlQueueName, {
      url: url,
      q: resultQueueName
    });
    ++resultsExpected;
  }
  channel.pop(resultQueueName, onData);
  return console.log('waiting for responses from worker...');
};

onData = function(result) {
  console.log('result = ', result);
  if (--resultsExpected) {
    return channel.pop(resultQueueName, onData);
  } else {
    return shutDown();
  }
};

shutDown = function() {
  channel.end();
  return process.exit();
};
