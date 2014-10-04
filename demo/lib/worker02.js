'use strict';

var RedisQueue, SHA1, memwatch, myQueue, request, urlQueueName, urlQueueTimeout, verbose;

SHA1 = require('../lib/helpers/tinySHA1.r4.js').SHA1;

request = require('request');

RedisQueue = require('../../../node-redis-queue');

urlQueueName = 'urlq';

urlQueueTimeout = 1;

verbose = process.argv[3] === 'verbose';

if (process.argv[2] === 'mem') {
  memwatch = require('memwatch');
  memwatch.on('stats', function(d) {
    return console.log('>>>current = ' + d.current_base + ', max = ' + d.max);
  });
  memwatch.on('leak', function(d) {
    return console.log('>>>LEAK = ', d);
  });
}

myQueue = new RedisQueue;

myQueue.connect();

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

myQueue.on('message', function(queueName, req) {
  if (typeof req === 'object') {
    console.log('worker01 processing request ', req);
    return request(req.url, function(error, response, body) {
      var sha1;
      if (!error && response.statusCode === 200) {
        sha1 = SHA1(body);
        console.log(req.url + ' SHA1 = ' + sha1);
        return myQueue.push(req.q, {
          url: req.url,
          sha1: sha1
        });
      } else {
        console.log(error);
        return myQueue.push(req.q, {
          url: req.url,
          err: error
        });
      }
    });
  } else {
    if (typeof req === 'string' && req === '***stop***') {
      console.log('worker01 stopping');
      process.exit();
    }
    console.log('Unexpected message: ', req);
    return console.log('Type of message = ' + typeof req);
  }
});

myQueue.monitor(urlQueueTimeout, urlQueueName);

console.log('Waiting for data...');
