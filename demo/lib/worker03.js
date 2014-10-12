'use strict';

var WorkQueueBroker, createWorkQueues, done, initEventHandlers, myBroker, myWorkQueue1, myWorkQueue2, queuesActive, subscribeToQueues;

myWorkQueue1 = null;

myWorkQueue2 = null;

myBroker = null;

queuesActive = 0;

WorkQueueBroker = require('../../lib/workQueueBroker');

myBroker = new WorkQueueBroker();

myBroker.connect(function() {
  console.log('work queue broker ready');
  initEventHandlers();
  createWorkQueues();
  subscribeToQueues();
  myWorkQueue1.begin();
  myWorkQueue2.begin();
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
  myWorkQueue2 = myBroker.createQueue('work-queue-2');
  return queuesActive = 2;
};

subscribeToQueues = function() {
  console.log('subscribing to queue "test-queue-1"');
  myWorkQueue1.subscribe(function(payload, ack) {
    console.log('received message "' + payload + '" in queue "work-queue-1"');
    if (payload === '***stop***' && --queuesActive === 0) {
      end();
    }
    return ack();
  });
  console.log('subscribing to queue "test-queue-2"');
  return myWorkQueue2.subscribe(function(payload, ack) {
    console.log('received message "' + payload + '" in queue "work-queue-2"');
    if (payload === '***stop***' && --queuesActive === 0) {
      done();
    }
    return ack();
  });
};

done = function() {
  console.log('quitting');
  myBroker.end();
  return process.exit();
};
