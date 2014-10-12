'use strict';

var SHA1, WorkQueueBroker, checkArgs, createUrlQueue, initEventHandlers, myBroker, request, subscribeToUrlQueue, urlQueue, urlQueueName, verbose;

WorkQueueBroker = require('../../lib/workQueueBroker');

request = require('request');

SHA1 = require('../lib/helpers/tinySHA1.r4.js').SHA1;

urlQueueName = 'urlq';

urlQueue = null;

verbose = process.argv[3] === 'verbose';

myBroker = new WorkQueueBroker();

myBroker.connect(function() {
  checkArgs();
  initEventHandlers();
  createUrlQueue();
  subscribeToUrlQueue();
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
  myBroker.on('end', function() {
    console.log('worker01 detected Redis connection ended');
    return process.exit();
  });
  return myBroker.on('error', function(error) {
    console.log('worker01 stopping due to: ' + error);
    return process.exit();
  });
};

createUrlQueue = function() {
  return urlQueue = myBroker.createQueue(urlQueueName);
};

subscribeToUrlQueue = function() {
  return urlQueue.subscribe(function(req, ack) {
    if (typeof req === 'object') {
      console.log('worker01 processing request ', req);
      return request(req.url, function(error, response, body) {
        var sha1;
        if (!error && response.statusCode === 200) {
          sha1 = SHA1(body);
          console.log('publishing ' + req.url + ' SHA1 = ' + sha1);
          myBroker.qmgr.push(req.q, {
            url: req.url,
            sha1: sha1
          });
          return ack();
        } else {
          console.log('>>>error: ', error);
          myBroker.qmgr.push(req.q, {
            url: req.url,
            err: error,
            code: response.statusCode
          });
          return process.exit();
        }
      });
    } else {
      if (typeof req === 'string' && req === '***stop***') {
        console.log('worker04 stopping');
        process.exit();
      }
      console.log('Unexpected message: ', req);
      console.log('Type of message = ' + typeof req);
      return ack();
    }
  });
};
