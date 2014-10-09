'use strict';

var RedisQueue, SHA1, checkArgs, initEventHandlers, myQueue, redisQueueTimeout, request, urlQueueName, verbose;

RedisQueue = require('../../../node-redis-queue');

request = require('request');

SHA1 = require('../lib/helpers/tinySHA1.r4.js').SHA1;

urlQueueName = 'urlq';

redisQueueTimeout = 1;

myQueue = null;

verbose = process.argv[3] === 'verbose';

myQueue = new RedisQueue;

myQueue.connect(function() {
  checkArgs();
  initEventHandlers();
  myQueue.monitor(redisQueueTimeout, urlQueueName);
  return console.log('Waiting for data...');
});

checkArgs = function() {
  var memwatch;
  if (process.argv[2] === 'mem') {
    memwatch = require('memwatch');
    memwatch.on('stats', function(d) {
      return console.log('>>>current = ' + d.current_base + ', max = ' + d.max);
    });
    return memwatch.on('leak', function(d) {
      return console.log('>>>LEAK = ', d);
    });
  }
};

initEventHandlers = function() {
  myQueue.on('end', function() {
    console.log('worker01 detected Redis connection ended');
    return process.exit();
  });
  myQueue.on('error', function(error) {
    console.log('worker01 stopping due to: ' + error);
    return process.exit();
  });
  myQueue.on('timeout', function() {
    if (verbose) {
      return console.log('worker01 timeout');
    }
  });
  return myQueue.on('message', function(queueName, url) {
    if (typeof url === 'string') {
      if (url === '***stop***') {
        console.log('worker01 stopping');
        process.exit();
      }
      console.log('worker01 processing URL "' + url + '"');
      return request(url, function(error, response, body) {
        var sha1;
        if (!error && response.statusCode === 200) {
          sha1 = SHA1(body);
          return console.log(url + ' SHA1 = ' + sha1);
        } else {
          return console.log(error);
        }
      });
    } else {
      return console.log('Unexpected message: ', url);
    }
  });
};
