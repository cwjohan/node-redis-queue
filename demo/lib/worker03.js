'use strict';

var WorkQueueBroker, createWorkQueues, end, initEventHandlers, myBroker, myWorkQueue1, myWorkQueue2, subscribeToQueues;

myWorkQueue1 = null;

myWorkQueue2 = null;

myBroker = null;

WorkQueueBroker = require('../../lib/workQueueBroker');

myBroker = new WorkQueueBroker();

myBroker.connect(function() {
  console.log('work queue broker ready');
  initEventHandlers();
  createWorkQueues();
  subscribeToQueues();
  myBroker.begin();
  return console.log('waiting for data...');
});

initEventHandlers = function() {
  myBroker.on('error', function(error) {
    console.log('>>>' + error);
    return end();
  });
  return myBroker.on('end', function() {
    return console.log('>>>End Redis connection');
  });
};

createWorkQueues = function() {
  myWorkQueue1 = myBroker.createQueue('work-queue-1');
  return myWorkQueue2 = myBroker.createQueue('work-queue-2');
};

subscribeToQueues = function() {
  console.log('subscribing to queue "test-queue-1"');
  myWorkQueue1.subscribe(function(payload) {
    console.log('received message "' + payload + '" in queue "work-queue-1"');
    if (payload === '***stop***') {
      end();
    }
    return true;
  });
  console.log('subscribing to queue "test-queue-2"');
  return myWorkQueue2.subscribe(function(payload) {
    console.log('received message "' + payload + '" in queue "work-queue-2"');
    if (payload === '***stop***') {
      end();
    }
    return true;
  });
};

end = function() {
  console.log('quitting');
  myBroker.end();
  return process.exit();
};
