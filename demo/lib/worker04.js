'use strict';

/*
WorkQueueBroker Example -- worker04

This app consumes work requests that become available in the 'urlq' queue,
as provided by provider04. For each one it receives, this app computes an
SHA1 value on the request URL (req.url) and outputs that and the request
URL value (req.url) to the result queue (req.q) specified in the work request.
provider04 consumes the data in the result queue.

However, if this app receives a '***stop***' message, it closes the connection
and quits immediately.

Usage:
   cd demo/lib
   export NODE_PATH='../../..'
   node worker04.js

Use this app in conjunction with provider04.js. See the provider04 source code
for more details.
*/

var SHA1, WorkQueueBroker, consumeUrlQueue, createUrlQueue, initEventHandlers, myBroker, request, shutDown, urlQueue, urlQueueName;

WorkQueueBroker = require('node-redis-queue').WorkQueueBroker;

request = require('request');

SHA1 = require('../lib/helpers/tinySHA1.r4.js').SHA1;

urlQueueName = 'urlq';

urlQueue = null;

myBroker = new WorkQueueBroker();

myBroker.connect(function() {
  initEventHandlers();
  createUrlQueue();
  consumeUrlQueue();
  return console.log('waiting for work...');
});

initEventHandlers = function() {
  myBroker.on('end', function() {
    console.log('worker04 detected Redis connection ended');
    return shutDown();
  });
  return myBroker.on('error', function(error) {
    console.log('worker04 stopping due to: ' + error);
    return shutDown();
  });
};

createUrlQueue = function() {
  urlQueue = myBroker.createQueue(urlQueueName);
};

consumeUrlQueue = function() {
  return urlQueue.consume(function(req, ack) {
    if (typeof req === 'object') {
      console.log('worker04 processing request ', req);
      return request(req.url, function(error, response, body) {
        var sha1;
        if (!error && response.statusCode === 200) {
          sha1 = SHA1(body);
          console.log('sending ' + req.url + ' SHA1 = ' + sha1);
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
          return shutDown();
        }
      });
    } else {
      if (typeof req === 'string' && req === '***stop***') {
        console.log('worker04 stopping');
        shutDown();
      }
      console.log('Unexpected message: ', req);
      console.log('Type of message = ' + typeof req);
      return ack();
    }
  });
};

shutDown = function() {
  myBroker.end();
  return process.exit();
};
