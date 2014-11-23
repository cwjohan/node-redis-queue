'use strict';

/*
WorkQueueMgr Example -- provider03

For each string in the two expectedItems lists, this app sends it
into either 'demo:work-queue-1' or 'demo:work-queue-2' for consumption by worker03.
When done with that, it quits.

Usage:
  cd demo/lib
  export NODE_PATH='../../..'
  node provider01.js clear
  node provider01.js
  node provider01.js 10
  ...
  node provider01.js stop

Use this app in conjunction with worker03.js. See the worker03 source code
for more details.
*/

var WorkQueueMgr, clear, clearWorkQueues, createWorkQueues, expectedItemsQ1, expectedItemsQ2, initEventHandlers, itemCntQ1, itemCntQ2, mgr, queue1, queue1Name, queue2, queue2Name, sendData, sendStop, shutDown, stop, timesToRepeat;

queue1 = null;

queue2 = null;

queue1Name = 'demo:work-queue-1';

queue2Name = 'demo:work-queue-2';

mgr = null;

expectedItemsQ1 = ['item one', 'item two', 'item three'];

itemCntQ1 = 0;

expectedItemsQ2 = ['item foo', 'item bar', 'item baz'];

itemCntQ2 = 0;

clear = process.argv[2] === 'clear';

stop = process.argv[2] === 'stop';

timesToRepeat = parseInt(process.argv[2]) || 1;

WorkQueueMgr = require('node-redis-queue').WorkQueueMgr;

mgr = new WorkQueueMgr();

mgr.connect(function() {
  console.log('work queue manager ready');
  initEventHandlers();
  createWorkQueues();
  if (stop) {
    sendStop();
    return shutDown();
  } else if (clear) {
    return clearWorkQueues(function() {
      return shutDown();
    });
  } else {
    sendData();
    return shutDown();
  }
});

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
};

clearWorkQueues = function(done) {
  var queuesToClear;
  queuesToClear = 2;
  queue1.clear(function() {
    console.log('Cleared "' + queue1.queueName + '"');
    if (!--queuesToClear) {
      return done();
    }
  });
  return queue2.clear(function() {
    console.log('Cleared "' + queue2.queueName + '"');
    if (!--queuesToClear) {
      return done();
    }
  });
};

sendData = function() {
  var item, _i, _j, _len, _len1;
  while (timesToRepeat--) {
    for (_i = 0, _len = expectedItemsQ1.length; _i < _len; _i++) {
      item = expectedItemsQ1[_i];
      console.log('publishing "' + item + '" to queue "' + queue1.queueName + '"');
      queue1.send(item);
    }
    for (_j = 0, _len1 = expectedItemsQ2.length; _j < _len1; _j++) {
      item = expectedItemsQ2[_j];
      console.log('publishing "' + item + '" to queue "' + queue2.queueName + '"');
      queue2.send(item);
    }
  }
};

sendStop = function() {
  console.log('stopping worker03');
  queue1.send('***stop***');
  return queue2.send('***stop***');
};

shutDown = function() {
  return mgr.shutdownSoon();
};
