'use strict';

var WorkQueueBroker, expectedItemsQ1, expectedItemsQ2, itemCntQ1, itemCntQ2, monitorTimeout, myBroker, myWorkQueue1, myWorkQueue2;

monitorTimeout = 1;

myWorkQueue1 = null;

myWorkQueue2 = null;

myBroker = null;

expectedItemsQ1 = ['item one', 'item two', 'item three'];

itemCntQ1 = 0;

expectedItemsQ2 = ['item foo', 'item bar', 'item baz'];

itemCntQ2 = 0;

WorkQueueBroker = require('./workQueueBroker');

describe('WorkQueueBroker', function() {
  it('must connect to redis-server', function(done) {
    myBroker = new WorkQueueBroker();
    return myBroker.connect(function() {
      console.log('work queue broker ready');
      myBroker.on('error', function(error) {
        console.log('>>>' + error);
        return process.exit();
      });
      myBroker.on('timeout', function() {
        return console.log('>>>timeout');
      });
      myBroker.on('end', function() {
        return console.log('>>>End Redis connection');
      });
      return done();
    });
  });
  it('creates and clears a queue with no problem', function(done) {
    var clearCnt;
    myWorkQueue1 = myBroker.createQueue('work-queue-1');
    expect(typeof myWorkQueue1.subscribe).toEqual('function');
    myWorkQueue2 = myBroker.createQueue('work-queue-2');
    expect(typeof myWorkQueue2.subscribe).toEqual('function');
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
  });
  it('receives all published data from given queues', function(done) {
    var item, queueDoneCnt, _i, _j, _len, _len1;
    queueDoneCnt = 0;
    console.log('subscribing to queue "test-queue-1"');
    myWorkQueue1.subscribe(function(payload) {
      console.log('received message "' + payload + '" in queue "test-queue-1"');
      expect(payload).toEqual(expectedItemsQ1[itemCntQ1++]);
      if (itemCntQ1 >= expectedItemsQ1.length) {
        if (++queueDoneCnt >= 2) {
          return done();
        }
      }
    });
    console.log('subscribing to queue "test-queue-2"');
    myWorkQueue2.subscribe(function(payload) {
      console.log('received message "' + payload + '" in queue "test-queue-2"');
      expect(payload).toEqual(expectedItemsQ2[itemCntQ2++]);
      if (itemCntQ2 >= expectedItemsQ2.length) {
        if (++queueDoneCnt >= 2) {
          return done();
        }
      }
    });
    for (_i = 0, _len = expectedItemsQ1.length; _i < _len; _i++) {
      item = expectedItemsQ1[_i];
      console.log('publishing "' + item + '" to queue "test-queue-1"');
      myWorkQueue1.publish(item);
    }
    for (_j = 0, _len1 = expectedItemsQ2.length; _j < _len1; _j++) {
      item = expectedItemsQ2[_j];
      console.log('publishing "' + item + '" to queue "test-queue-2"');
      myWorkQueue2.publish(item);
    }
    return myBroker.monitor(monitorTimeout);
  });
  return it('quits Redis cleanly', function() {
    console.log('Ending work queue broker');
    return expect(myBroker.end()).toEqual(true);
  });
});
