'use strict';

var WorkQueueBroker, clear, clearWorkQueues, createWorkQueues, end, expectedItemsQ1, expectedItemsQ2, initEventHandlers, itemCntQ1, itemCntQ2, myBroker, myWorkQueue1, myWorkQueue2, postData, postStop, stop;

myWorkQueue1 = null;

myWorkQueue2 = null;

myBroker = null;

expectedItemsQ1 = ['item one', 'item two', 'item three'];

itemCntQ1 = 0;

expectedItemsQ2 = ['item foo', 'item bar', 'item baz'];

itemCntQ2 = 0;

clear = process.argv[2] === 'clear';

stop = process.argv[2] === 'stop';

WorkQueueBroker = require('../../lib/workQueueBroker');

myBroker = new WorkQueueBroker();

myBroker.connect(function() {
  console.log('work queue broker ready');
  initEventHandlers();
  createWorkQueues();
  if (stop) {
    postStop();
    end();
  }
  if (clear) {
    return clearWorkQueues(function() {
      postData();
      return end();
    });
  } else {
    postData();
    return end();
  }
});

initEventHandlers = function() {
  myBroker.on('error', function(error) {
    console.log('>>>' + error);
    return process.exit();
  });
  return myBroker.on('end', function() {
    return console.log('>>>End Redis connection');
  });
};

createWorkQueues = function() {
  myWorkQueue1 = myBroker.createQueue('work-queue-1');
  return myWorkQueue2 = myBroker.createQueue('work-queue-2');
};

clearWorkQueues = function(done) {
  var clearCnt;
  clearCnt = 0;
  myWorkQueue1.clear(function() {
    console.log('Cleared "work-queue-1"');
    if (++clearCnt >= 2) {
      return done();
    }
  });
  return myWorkQueue2.clear(function() {
    console.log('Cleared "work-queue-2"');
    if (++clearCnt >= 2) {
      return done();
    }
  });
};

postData = function() {
  var item, _i, _j, _len, _len1, _results;
  for (_i = 0, _len = expectedItemsQ1.length; _i < _len; _i++) {
    item = expectedItemsQ1[_i];
    console.log('publishing "' + item + '" to queue "work-queue-1"');
    myWorkQueue1.publish(item);
  }
  _results = [];
  for (_j = 0, _len1 = expectedItemsQ2.length; _j < _len1; _j++) {
    item = expectedItemsQ2[_j];
    console.log('publishing "' + item + '" to queue "work-queue-2"');
    _results.push(myWorkQueue2.publish(item));
  }
  return _results;
};

postStop = function() {
  console.log('stopping worker03');
  myWorkQueue1.publish('***stop***');
  return myWorkQueue2.publish('***stop***');
};

end = function() {
  console.log('Ending work queue broker');
  return myBroker.end();
};
