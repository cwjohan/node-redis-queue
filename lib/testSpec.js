'use strict';

var RedisQueue, expectedItems, itemCnt, myQueue, redisClient, redisQueueTimeout;

RedisQueue = require('..');

redisQueueTimeout = 0;

redisClient = null;

myQueue = null;

expectedItems = ['item one', 'item two', 'item three'];

itemCnt = 0;

describe('RedisQueue', function() {
  it('must connect to redis-server', function(done) {
    var config, configurator;
    configurator = require('./redisQueueConfig');
    config = configurator.getConfig();
    redisClient = configurator.getClient(config);
    expect(redisClient).toBeDefined();
    return done();
  });
  it('constructor must return a queue object', function(done) {
    myQueue = new RedisQueue(redisClient, redisQueueTimeout);
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
    return myQueue.monitor('test-queue');
  });
  return it('quits Redis cleanly', function() {
    console.log('Quitting redis');
    return expect(redisClient.end()).toBeUndefined();
  });
});
