'use strict';

/*
WorkQueueMgr Example -- worker04

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
 or
   node worker04.js 3
 to demonstrate arity feature.

Use this app in conjunction with provider04.js. See the provider04 source code
for more details.
*/

var SHA1, WorkQueueMgr, arity, consumeUrlQueue, createUrlQueue, initEventHandlers, mgr, mgr2, request, shutDown, urlQueue, urlQueueName;

WorkQueueMgr = require('node-redis-queue').WorkQueueMgr;

request = require('request');

SHA1 = require('../lib/helpers/tinySHA1.r4.js').SHA1;

urlQueueName = 'urlq';

urlQueue = null;

arity = parseInt(process.argv[2]) || 1;

mgr = new WorkQueueMgr();

mgr2 = arity > 1 ? new WorkQueueMgr() : mgr;

mgr.connect(function() {
  console.log('receive channel connected');
  initEventHandlers();
  if (mgr2 !== mgr) {
    mgr2.connect(function() {
      return console.log('send channel connected');
    });
  }
  createUrlQueue();
  consumeUrlQueue();
  return console.log('waiting for work...');
});

initEventHandlers = function() {
  mgr.on('end', function() {
    console.log('worker04 detected Redis connection ended');
    return shutDown();
  });
  return mgr.on('error', function(error) {
    console.log('worker04 stopping due to: ' + error);
    return shutDown();
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
          mgr2.channel.push(req.q, {
            url: req.url,
            sha1: sha1
          });
          return ack();
        } else {
          console.log('>>>error: ', error);
          mgr2.send(req.q, {
            url: req.url,
            err: error
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
  }, arity);
};

shutDown = function() {
  mgr.end();
  return process.exit();
};
