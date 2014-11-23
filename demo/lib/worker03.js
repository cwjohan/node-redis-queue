'use strict';

/*
WorkQueueMgr Example -- worker03

This program consumes two work queues: 'demo:work-queue-1' and 'demo:work-queue-2'.
It simply prints each message consumed and then "acks" it, so that the
next message will become available. Each work queue operates independently.

Usage:
  cd demo/lib
  export NODE_PATH='../../..'
  node worker03.js

 or, to monitor for memory leaks
  node worker03.js mem | grep '>>>'

Use this program in conjunction with provider03. See provider03 source code
for more details.
*/

var WorkQueueMgr, checkArgs, consumeData, createWorkQueues, initEventHandlers, mgr, queue1, queue1Name, queue2, queue2Name, queuesActive, shutDown;

queue1 = null;

queue2 = null;

queue1Name = 'demo:work-queue-1';

queue2Name = 'demo:work-queue-2';

mgr = null;

queuesActive = 0;

WorkQueueMgr = require('node-redis-queue').WorkQueueMgr;

mgr = new WorkQueueMgr();

mgr.connect(function() {
  console.log('work queue broker ready');
  checkArgs();
  initEventHandlers();
  createWorkQueues();
  consumeData();
  return console.log('waiting for data...');
});

checkArgs = function() {
  var memwatch;
  if (process.argv[2] === 'mem') {
    console.log('monitoring for memory leaks');
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
  mgr.on('error', function(error) {
    console.log('>>>' + error);
    return shutDown();
  });
  return mgr.on('end', function() {
    console.log('>>>End Redis connection');
    return shutDown();
  });
};

createWorkQueues = function() {
  queue1 = mgr.createQueue(queue1Name);
  queue2 = mgr.createQueue(queue2Name);
  queuesActive = 2;
};

consumeData = function() {
  console.log('consuming queue "' + queue1.queueName + '"');
  queue1.consume(function(payload, ack) {
    console.log('received message "' + payload + '" in queue "' + queue1.queueName + '"');
    ack(payload === '***stop***');
    if (payload === '***stop***' && --queuesActive === 0) {
      return mgr.end();
    }
  });
  console.log('consuming queue "' + queue2.queueName + '"');
  return queue2.consume(function(payload, ack) {
    console.log('received message "' + payload + '" in queue "' + queue2.queueName + '"');
    ack(payload === '***stop***');
    if (payload === '***stop***' && --queuesActive === 0) {
      return mgr.end();
    }
  });
};

shutDown = function() {
  mgr.end();
  return process.exit();
};
