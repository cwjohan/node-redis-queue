'use strict';

/*
WorkQueueBroker Example -- worker03

This program consumes two work queues: 'work-queue-1' and 'work-queue-2'.
It simply prints each message consumed and then "acks" it, so that the
next message will become available. Each work queue operates independently.

Usage:
  cd demo/lib
  export NODE_PATH='../../..'
  node worker03.js

Use this program in conjunction with provider03. See provider03 source code
for more details.
*/

var WorkQueueBroker, consumeData, createWorkQueues, initEventHandlers, myBroker, myWorkQueue1, myWorkQueue2, queuesActive, shutDown;

myWorkQueue1 = null;

myWorkQueue2 = null;

myBroker = null;

queuesActive = 0;

WorkQueueBroker = require('node-redis-queue').WorkQueueBroker;

myBroker = new WorkQueueBroker();

myBroker.connect(function() {
  console.log('work queue broker ready');
  initEventHandlers();
  createWorkQueues();
  consumeData();
  return console.log('waiting for data...');
});

initEventHandlers = function() {
  myBroker.on('error', function(error) {
    console.log('>>>' + error);
    return shutDown();
  });
  return myBroker.on('end', function() {
    console.log('>>>End Redis connection');
    return shutDown();
  });
};

createWorkQueues = function() {
  myWorkQueue1 = myBroker.createQueue('work-queue-1');
  myWorkQueue2 = myBroker.createQueue('work-queue-2');
  return queuesActive = 2;
};

consumeData = function() {
  console.log('consuming queue "work-queue-1"');
  myWorkQueue1.consume(function(payload, ack) {
    console.log('received message "' + payload + '" in queue "work-queue-1"');
    if (payload === '***stop***' && --queuesActive === 0) {
      shutDown();
    }
    return ack();
  });
  console.log('consuming queue "work-queue-2"');
  return myWorkQueue2.consume(function(payload, ack) {
    console.log('received message "' + payload + '" in queue "work-queue-2"');
    if (payload === '***stop***' && --queuesActive === 0) {
      shutDown();
    }
    return ack();
  });
};

shutDown = function() {
  myBroker.end();
  return process.exit();
};
