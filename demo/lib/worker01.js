'use strict';

/*
Channel Example -- worker01

This app waits for URLs to become available in the 'urlq' queue, as provided
by worker01. Then, for each one it receives, the app gets the page for the URL,
computes an SHA1 value, and outputs it to the console log.
However, if it receives a '***stop***' message, it closes the connection and
quits immediately.

Usage:
  cd demo/lib
  export NODE_PATH='../../..'
  node worker01.js

Use this app in conjunction with provider01.js. See the provider01 source code
for more details.
*/

var Channel, SHA1, channel, initEventHandlers, onData, request, shutDown, urlQueueName;

Channel = require('node-redis-queue').Channel;

request = require('request');

SHA1 = require('../lib/helpers/tinySHA1.r4.js').SHA1;

urlQueueName = 'urlq';

channel = null;

channel = new Channel();

channel.connect(function() {
  initEventHandlers();
  channel.pop(urlQueueName, onData);
  return console.log('Waiting for data...');
});

initEventHandlers = function() {
  channel.on('end', function() {
    console.log('worker01 detected Redis connection ended');
    return shutDown();
  });
  return channel.on('error', function(error) {
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
        channel.pop(urlQueueName, onData);
      } else {
        console.log(error);
      }
    });
  } else {
    return console.log('Unexpected message: ', url);
  }
};

shutDown = function() {
  channel.end();
  return process.exit();
};
