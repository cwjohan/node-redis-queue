'use strict';

/*
QueueMgr Example -- woker02

This app waits for work requests to become available in the 'urlq' queue.
Then, for each one it receives, the app get the page for the URL, computes an
SHA1 value on the request URL (req.url) and outputs that and the request URL
value (req.url) to the result queue (req.q) specified in the work request.
However, if it receives a '***stop***' message, it closes the connection
and quits immediately.

Usage:
  cd demo/lib
  export NODE_PATH='../../..'
  node worker02.js
 or
  node worker02.js mem verbose

Use this app in conjunction with provider02.js. See the provider02 source code
for more details.
*/

var QueueMgr, SHA1, checkArgs, initEventHandlers, onData, qmgr, request, shutDown, urlQueueName, verbose;

QueueMgr = require('node-redis-queue').QueueMgr;

request = require('request');

SHA1 = require('../lib/helpers/tinySHA1.r4.js').SHA1;

urlQueueName = 'urlq';

verbose = process.argv[3] === 'verbose';

qmgr = new QueueMgr;

qmgr.connect(function() {
  checkArgs();
  initEventHandlers();
  qmgr.pop(urlQueueName, onData);
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
  qmgr.on('end', function() {
    console.log('worker01 detected Redis connection ended');
    return shutDown();
  });
  return qmgr.on('error', function(error) {
    console.log('worker01 stopping due to: ' + error);
    return shutDown();
  });
};

onData = function(req) {
  if (typeof req === 'object') {
    console.log('worker01 processing request ', req);
    return request(req.url, function(error, response, body) {
      var sha1;
      if (!error && response.statusCode === 200) {
        sha1 = SHA1(body);
        console.log(req.url + ' SHA1 = ' + sha1);
        qmgr.push(req.q, {
          url: req.url,
          sha1: sha1
        });
      } else {
        console.log(error);
        qmgr.push(req.q, {
          url: req.url,
          err: error,
          code: response.statusCode
        });
      }
      return qmgr.pop(urlQueueName, onData);
    });
  } else {
    if (typeof req === 'string' && req === '***stop***') {
      console.log('worker02 stopping');
      shutDown();
    }
    console.log('Unexpected message: ', req);
    console.log('Type of message = ' + typeof req);
    return shutDown();
  }
};

shutDown = function() {
  qmgr.end();
  return process.exit();
};
