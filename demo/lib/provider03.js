'use strict';

/*
WorkQueueBroker Example -- provider03

For each string in the two expectedItems lists, this app sends it
into either 'work-queue-1' or 'work-queue-2' for consumption by worker03.
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

var WorkQueueBroker, clear, clearWorkQueues, createWorkQueues, expectedItemsQ1, expectedItemsQ2, initEventHandlers, itemCntQ1, itemCntQ2, myBroker, myWorkQueue1, myWorkQueue2, sendData, sendStop, shutDown, stop, timesToRepeat;

myWorkQueue1 = null;

myWorkQueue2 = null;

myBroker = null;

expectedItemsQ1 = ['item one', 'item two', 'item three'];

itemCntQ1 = 0;

expectedItemsQ2 = ['item foo', 'item bar', 'item baz'];

itemCntQ2 = 0;

clear = process.argv[2] === 'clear';

stop = process.argv[2] === 'stop';

timesToRepeat = parseInt(process.argv[2]) || 1;

WorkQueueBroker = require('node-redis-queue').WorkQueueBroker;

myBroker = new WorkQueueBroker();

myBroker.connect(function() {
  console.log('work queue broker ready');
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
};

clearWorkQueues = function(done) {
  var queuesToClear;
  queuesToClear = 2;
  myWorkQueue1.clear(function() {
    console.log('Cleared "work-queue-1"');
    if (!--queuesToClear) {
      return done();
    }
  });
  return myWorkQueue2.clear(function() {
    console.log('Cleared "work-queue-2"');
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
      console.log('publishing "' + item + '" to queue "work-queue-1"');
      myWorkQueue1.send(item);
    }
    for (_j = 0, _len1 = expectedItemsQ2.length; _j < _len1; _j++) {
      item = expectedItemsQ2[_j];
      console.log('publishing "' + item + '" to queue "work-queue-2"');
      myWorkQueue2.send(item);
    }
  }
};

sendStop = function() {
  console.log('stopping worker03');
  myWorkQueue1.send('***stop***');
  return myWorkQueue2.send('***stop***');
};

shutDown = function() {
  return myBroker.shutdownSoon();
};
