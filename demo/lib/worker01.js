'use strict';

/*
QueueMgr Example -- worker01

This app waits for URLs to become available in the 'urlq' queue, as provided
by worker01. Then, for each one it receives, the app gets the page for the URL,
computes an SHA1 value, and outputs it to the console log.
However, if it receives a '***stop***' message, it closes the connection and
quits immediately.

Usage:
  cd demo/lib
  export NODE_PATH='../../..'
  node worker01.js
or
  node worker01.js mem verbose

Use this app in conjunction with provider01.js. See the provider01 source code
for more details.
*/

var QueueMgr, SHA1, checkArgs, initEventHandlers, onData, qmgr, request, shutDown, urlQueueName, verbose;

QueueMgr = require('node-redis-queue').QueueMgr;

request = require('request');

SHA1 = require('../lib/helpers/tinySHA1.r4.js').SHA1;

urlQueueName = 'urlq';

qmgr = null;

verbose = process.argv[3] === 'verbose';

qmgr = new QueueMgr;

qmgr.connect(function() {
  checkArgs();
  initEventHandlers();
  qmgr.pop(urlQueueName, onData);
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
  qmgr.on('end', function() {
    console.log('worker01 detected Redis connection ended');
    return shutDown();
  });
  return qmgr.on('error', function(error) {
    console.log('worker01 stopping due to: ' + error);
    return shutDown();
  });
};

onData = function(url) {
  console.log('message url = ' + url);
  if (typeof url === 'string') {
    if (url === '***stop***') {
      console.log('worker01 stopping');
      shutDown();
    }
    console.log('worker01 processing URL "' + url + '"');
    return request(url, function(error, response, body) {
      var sha1;
      if (!error && response.statusCode === 200) {
        sha1 = SHA1(body);
        console.log(url + ' SHA1 = ' + sha1);
        qmgr.pop(urlQueueName, onData);
      } else {
        console.log(error);
      }
    });
  } else {
    return console.log('Unexpected message: ', url);
  }
};

shutDown = function() {
  qmgr.end();
  return process.exit();
};
