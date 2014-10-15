'use strict';

var QueueMgr, expectedItems, qmgr, queueName;

QueueMgr = require('..').QueueMgr;

qmgr = null;

queueName = 'test-queue';

expectedItems = ['item one', 'item two', 'item three'];

describe('QueueMgr push/pop', function() {
  it('must connect to redis-server', function(done) {
    qmgr = new QueueMgr;
    return qmgr.connect(function() {
      console.log('push/pop queue mgr ready');
      expect(typeof qmgr).toEqual('object');
      expect(typeof qmgr.push).toEqual('function');
      qmgr.on('error', function(error) {
        console.log('>>>' + error);
        return process.exit();
      });
      return qmgr.clear(queueName, function() {
        console.log('Cleared "' + queueName + '"');
        return done();
      });
    });
  });
  it('must retrieve pushed items in correct order', function(done) {
    var item, itemCnt, _i, _j, _len, _len1, _results;
    qmgr.on('end', function() {
      return console.log('>>>End QueueMgr connection');
    });
    for (_i = 0, _len = expectedItems.length; _i < _len; _i++) {
      item = expectedItems[_i];
      console.log('Pushing message "' + item + '" to queue "' + queueName + '"');
      qmgr.push(queueName, item);
    }
    itemCnt = 0;
    _results = [];
    for (_j = 0, _len1 = expectedItems.length; _j < _len1; _j++) {
      item = expectedItems[_j];
      _results.push(qmgr.pop(queueName, function(data) {
        console.log('Received message "' + data + '" in queue "' + queueName + '"');
        console.log('>>>expecting "' + expectedItems[itemCnt] + '"');
        expect(data).toEqual(expectedItems[itemCnt++]);
        if (itemCnt === expectedItems.length) {
          return done();
        }
      }));
    }
    return _results;
  });
  return it('quits cleanly', function() {
    console.log('Ending QueueMgr push/pop test');
    return expect(qmgr.end()).toEqual(true);
  });
});
