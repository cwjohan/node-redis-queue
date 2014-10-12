'use strict';

var RedisQueue, SHA1, checkArgs, initEventHandlers, monitorTimeout, myQueue, request, urlQueueName, verbose;

RedisQueue = require('../../../node-redis-queue');

request = require('request');

SHA1 = require('../lib/helpers/tinySHA1.r4.js').SHA1;

urlQueueName = 'urlq';

monitorTimeout = 1;

verbose = process.argv[3] === 'verbose';

myQueue = new RedisQueue;

myQueue.connect(function() {
  checkArgs();
  initEventHandlers();
  myQueue.monitor(monitorTimeout, urlQueueName);
  return console.log('waiting for work...');
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
  return myQueue.on('message', function(queueName, req) {
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
            err: error,
            code: response.statusCode
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
};
