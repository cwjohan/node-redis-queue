'use strict';

var WorkQueueBroker, expectedItemsQ1, expectedItemsQ2, myBroker, myWorkQueue1, myWorkQueue2, workQueue1Name, workQueue2Name;

myWorkQueue1 = null;

myWorkQueue2 = null;

workQueue1Name = 'test-queue-1';

workQueue2Name = 'test-queue-2';

myBroker = null;

expectedItemsQ1 = ['item one', 'item two', 'item three'];

expectedItemsQ2 = ['item foo', 'item bar', 'item baz'];

WorkQueueBroker = require('..').WorkQueueBroker;

describe('WorkQueueBroker send/consume', function() {
  it('must connect to redis-server', function(done) {
    myBroker = new WorkQueueBroker();
    return myBroker.connect(function() {
      console.log('work queue broker ready');
      myBroker.on('error', function(error) {
        console.log('>>>' + error);
        return process.exit();
      });
      myBroker.on('end', function() {
        return console.log('>>>End WorkQueueBroker connection');
      });
      return done();
    });
  });
  it('creates and clears a queue with no problem', function(done) {
    var queuesToClear;
    myWorkQueue1 = myBroker.createQueue(workQueue1Name);
    expect(myWorkQueue1.queueName).toEqual(workQueue1Name);
    myWorkQueue2 = myBroker.createQueue(workQueue2Name);
    expect(myWorkQueue2.queueName).toEqual(workQueue2Name);
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
  });
  it('receives all published data from given queues (no interleaving)', function(done) {
    var item, itemCntQ1, itemCntQ2, itemsInQueues, _i, _j, _len, _len1;
    itemsInQueues = 0;
    for (_i = 0, _len = expectedItemsQ1.length; _i < _len; _i++) {
      item = expectedItemsQ1[_i];
      console.log('publishing "' + item + '" to queue "' + workQueue1Name + '"');
      myWorkQueue1.send(item);
      ++itemsInQueues;
    }
    for (_j = 0, _len1 = expectedItemsQ2.length; _j < _len1; _j++) {
      item = expectedItemsQ2[_j];
      console.log('publishing "' + item + '" to queue "' + workQueue2Name + '"');
      myWorkQueue2.send(item);
      ++itemsInQueues;
    }
    console.log('consuming queue "test-queue-1"');
    itemCntQ1 = 0;
    myWorkQueue1.consume(function(data, ack) {
      console.log('received message "' + data + '" in queue "' + workQueue1Name + '"');
      expect(data).toEqual(expectedItemsQ1[itemCntQ1++]);
      if (!--itemsInQueues) {
        done();
      }
      return ack(itemCntQ1 >= expectedItemsQ1.length);
    });
    console.log('consuming queue "test-queue-2"');
    itemCntQ2 = 0;
    return myWorkQueue2.consume(function(data, ack) {
      console.log('received message "' + data + '" in queue "' + workQueue2Name + '"');
      expect(data).toEqual(expectedItemsQ2[itemCntQ2++]);
      if (!--itemsInQueues) {
        done();
      }
      return ack(itemCntQ2 >= expectedItemsQ2.length);
    });
  });
  /*
    timerCallback = null
    beforeEach ->
      timerCallback = jasmine.createSpy('timerCallback')
      jasmine.clock().install()
  
    afterEach ->
      jasmine.clock().uninstall()
  */

  it('receives all published data from given queues (interleaving)', function(done) {
    var i, isEven, itemCntQ1, itemCntQ2, itemsInQueues, _i, _ref;
    itemsInQueues = 0;
    for (i = _i = 0, _ref = Math.max(expectedItemsQ1.length, expectedItemsQ2.length); 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
      if (i < expectedItemsQ1.length) {
        console.log('publishing "' + expectedItemsQ1[i] + '" to queue "' + workQueue1Name + '"');
        myWorkQueue1.send(expectedItemsQ1[i]);
        ++itemsInQueues;
      }
      if (i < expectedItemsQ2.length) {
        console.log('publishing "' + expectedItemsQ2[i] + '" to queue "' + workQueue2Name + '"');
        myWorkQueue2.send(expectedItemsQ2[i]);
        ++itemsInQueues;
      }
    }
    isEven = function(n) {
      return true;
    };
    /*
        waitFlag = false
        setTimeout 100, ->
          console.log '>>>>>>>>timer popped after 1 ms'
          waitFlag = true
        
        waitsFor 'timeout', ->
          return waitFlag
        ,200
    */

    console.log('consuming queue "test-queue-1"');
    itemCntQ1 = 0;
    myWorkQueue1.consume(function(data, ack) {
      console.log('received message "' + data + '" in queue "' + workQueue1Name + '"');
      expect(data).toEqual(expectedItemsQ1[itemCntQ1++]);
      if (isEven(itemCntQ1)) {
        if (!--itemsInQueues) {
          done();
        }
        if (!itemsInQueues) {
          console.log('>>>done Q1');
        }
        console.log('>>>ack Q1');
        return ack(itemCntQ1 >= expectedItemsQ1.length);
      } else {
        return setTimeout(0, function() {
          if (!--itemsInQueues) {
            done();
          }
          if (!itemsInQueues) {
            console.log('>>>done Q1');
          }
          console.log('>>>ack Q1 timeout');
          return ack(itemCntQ1 >= expectedItemsQ1.length);
        });
      }
    });
    console.log('consuming queue "test-queue-2"');
    itemCntQ2 = 0;
    return myWorkQueue2.consume(function(data, ack) {
      console.log('received message "' + data + '" in queue "' + workQueue2Name + '"');
      expect(data).toEqual(expectedItemsQ2[itemCntQ2++]);
      if (isEven(itemCntQ2)) {
        if (!--itemsInQueues) {
          done();
        }
        if (!itemsInQueues) {
          console.log('>>>done Q2');
        }
        console.log('>>>ack Q2');
        return ack(itemCntQ2 >= expectedItemsQ2.length);
      } else {
        return setTimeout(0, function() {
          if (!--itemsInQueues) {
            done();
          }
          if (!itemsInQueues) {
            console.log('>>>done Q2');
          }
          console.log('>>>ack Q2 timeout');
          return ack(itemCntQ2 >= expectedItemsQ2.length);
        });
      }
    });
  });
  return it('quits Redis cleanly', function() {
    console.log('Ending work queue broker test');
    return expect(myBroker.end()).toEqual(true);
  });
});
