'use strict';

var RedisQueue, expectedItems, itemCnt, myQueue, queueName;

RedisQueue = require('./');

myQueue = null;

queueName = 'test-queue';

expectedItems = ['item one', 'item two', 'item three'];

itemCnt = 0;

describe('RedisQueue push/pop', function() {
  it('must connect to redis-server', function(done) {
    myQueue = new RedisQueue;
    return myQueue.connect(function() {
      console.log('redis queue ready');
      expect(typeof myQueue).toEqual('object');
      myQueue.on('error', function(error) {
        console.log('>>>' + error);
        return process.exit();
      });
      return myQueue.clear(queueName, function() {
        console.log('Cleared "test-queue"');
        return done();
      });
    });
  });
  it('must retrieve pushed items in correct order', function(done) {
    var item, _i, _len;
    myQueue.on('message', function(queueName, payload) {
      console.log('Received message "' + payload + '" in queue "' + queueName + '"');
      expect(queueName).toEqual(queueName);
      expect(payload).toEqual(expectedItems[itemCnt++]);
      myQueue.pop(queueName);
      if (itemCnt >= expectedItems.length) {
        return done();
      }
    });
    myQueue.on('timeout', function() {
      return console.log('>>>Timeout...');
    });
    myQueue.on('end', function() {
      return console.log('>>>End redis connection');
    });
    for (_i = 0, _len = expectedItems.length; _i < _len; _i++) {
      item = expectedItems[_i];
      console.log('Pushing message "' + item + '" to queue "test-queue"');
      myQueue.push(queueName, item);
    }
    return myQueue.pop(queueName);
  });
  return it('quits Redis cleanly', function() {
    console.log('Ending redis queue');
    return expect(myQueue.end()).toEqual(true);
  });
});
