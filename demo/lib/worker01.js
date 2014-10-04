'use strict';

var SHA1, memwatch, myQueue, redisQueueTimeout, request, urlQueueName, verbose;

SHA1 = require('../lib/helpers/tinySHA1.r4.js').SHA1;

request = require('request');

urlQueueName = 'urlq';

redisQueueTimeout = 1;

myQueue = null;

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

myQueue.on('message', function(queueName, url) {
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

myQueue.monitor(redisQueueTimeout, urlQueueName);

console.log('Waiting for data...');
