'use strict';

/*
WorkQueueMgr Example -- worker04

This app consumes work requests that become available in the 'demo:urlq' queue,
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
 or
   node worker04.js 3
 to demonstrate arity feature.
 or
   node worker04.js 1 5
 to demonstrate the timeout feature.


Use this app in conjunction with provider04.js. See the provider04 source code
for more details.
*/

var SHA1, WorkQueueMgr, arity, consumeUrlQueue, createUrlQueue, initEventHandlers, mgr, onReady, request, shutDown, timeout, urlQueue, urlQueueName;

WorkQueueMgr = require('node-redis-queue').WorkQueueMgr;

request = require('request');

SHA1 = require('../lib/helpers/tinySHA1.r4.js').SHA1;

urlQueueName = 'demo:urlq';

urlQueue = null;

arity = parseInt(process.argv[2]) || 1;

timeout = parseInt(process.argv[3]) || 0;

console.log('arity=' + arity + ', timeout=' + timeout);

mgr = new WorkQueueMgr();

onReady = function() {
  console.log('channel connected');
  initEventHandlers();
  createUrlQueue();
  consumeUrlQueue();
  return console.log('waiting for work...');
};

if (arity === 1) {
  console.log('connecting half-duplex');
  mgr.connect(onReady);
} else {
  console.log('connecting full-duplex');
  mgr.connect2(onReady);
}

initEventHandlers = function() {
  mgr.on('end', function() {
    console.log('worker04 detected Redis connection ended');
    return shutDown();
  });
  mgr.on('error', function(error) {
    console.log('worker04 stopping due to error');
    throw error;
    return shutDown();
  });
  return mgr.on('timeout', function(keys, cancel) {
    return console.log('>>>timeout, keys=', keys);
  });
};

createUrlQueue = function() {
  urlQueue = mgr.createQueue(urlQueueName);
};

consumeUrlQueue = function() {
  return urlQueue.consume(function(req, ack) {
    if (typeof req === 'object') {
      console.log('worker04 processing request ', req, ' (' + mgr.channel.outstanding + ')');
      return request(req.url, function(error, response, body) {
        var sha1;
        if (!error && response.statusCode === 200) {
          sha1 = SHA1(body);
          console.log('sending ' + req.url + ' SHA1 = ' + sha1, ' (' + mgr.channel.outstanding + ')');
          mgr.channel.push(req.q, {
            url: req.url,
            sha1: sha1
          });
          return ack();
        } else {
          console.log('>>>error: ', error);
          mgr.channel.push(req.q, {
            url: req.url,
            err: error
          });
          return ack();
        }
      });
    } else {
      if (typeof req === 'string' && req === '***stop***') {
        console.log('worker04 stopping');
        shutDown();
      }
      console.log('Unexpected message: ', req);
      console.log('Type of message = ' + typeof req);
      return shutDown();
    }
  }, arity, timeout);
};

shutDown = function() {
  mgr.end();
  return process.exit();
};
