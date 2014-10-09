'use strict';

var RedisQueue, expectedItems, itemCnt, myQueue, redisQueueTimeout;

RedisQueue = require('./');

redisQueueTimeout = 1;

myQueue = null;

expectedItems = ['item one', 'item two', 'item three'];

itemCnt = 0;

describe('RedisQueue', function() {
  it('must connect to redis-server', function(done) {
    myQueue = new RedisQueue;
    return myQueue.connect(function() {
      console.log('redis queue ready');
      expect(typeof myQueue).toEqual('object');
      myQueue.on('error', function(error) {
        console.log('>>>' + error);
        return process.exit();
      });
      return myQueue.clear('test-queue', function() {
        console.log('Cleared "test-queue"');
        return done();
      });
    });
  });
  it('must retrieve pushed items in correct order', function(done) {
    var item, _i, _len;
    myQueue.on('message', function(queueName, payload) {
      console.log('Received message "' + payload + '" in queue "' + queueName + '"');
      expect(queueName).toEqual('test-queue');
      expect(payload).toEqual(expectedItems[itemCnt++]);
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
      myQueue.push('test-queue', item);
    }
    return myQueue.monitor(redisQueueTimeout, 'test-queue');
  });
  return it('quits Redis cleanly', function() {
    console.log('Ending redis queue');
    return expect(myQueue.end()).toEqual(true);
  });
});
