'use strict';

var RedisQueue, RedisQueueError, events,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

events = require('events');

RedisQueueError = (function(_super) {

  __extends(RedisQueueError, _super);

  function RedisQueueError() {
    return RedisQueueError.__super__.constructor.apply(this, arguments);
  }

  return RedisQueueError;

})(Error);

RedisQueue = (function(_super) {

  __extends(RedisQueue, _super);

  function RedisQueue() {
    this.configurator = require('./redisQueueConfig');
    this.config = this.configurator.getConfig();
    this.stop = false;
  }

  RedisQueue.prototype.connect = function(client) {
    var _this = this;
    this.client = client != null ? client : null;
    if (!this.client) {
      this.client = this.configurator.getClient(this.config);
    }
    this.client.on('error', function(err) {
      _this.stop = true;
      return _this.emit('error', err);
    });
    this.client.on('end', function() {
      _this.stop = true;
      return _this.emit('end');
    });
    return this.client;
  };

  RedisQueue.prototype.push = function(key, payload) {
    return this.client.lpush(key, JSON.stringify(payload));
  };

  RedisQueue.prototype.monitor = function() {
    var keysToMonitor, timeout, _ref,
      _this = this;
    timeout = arguments[0], keysToMonitor = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return (_ref = this.client).brpop.apply(_ref, __slice.call(keysToMonitor).concat([timeout], [function(err, replies) {
      if (err != null) {
        _this.emit('error', err);
      } else {
        if ((replies != null) && replies instanceof Array && replies.length === 2) {
          _this.emit('message', replies[0], JSON.parse(replies[1]));
        } else {
          if (replies != null) {
            _this.emit(new RedisQueueError('Replies not Array of two elements'));
          } else {
            _this.emit('timeout');
          }
        }
      }
      if (!_this.stop) {
        return _this.monitor.apply(_this, [timeout].concat(__slice.call(keysToMonitor)));
      }
    }]));
  };

  RedisQueue.prototype.clear = function() {
    var keysToClear, _ref;
    keysToClear = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return (_ref = this.client).del.apply(_ref, keysToClear);
  };

  RedisQueue.prototype.stopMonitoring = function() {
    return this.stop = true;
  };

  RedisQueue.prototype.disconnect = function() {
    return this.client.quit();
  };

  RedisQueue.prototype.end = function() {
    this.client.end();
    return true;
  };

  RedisQueue.prototype.config = function() {
    return this.config;
  };

  RedisQueue.prototype.client = function() {
    return this.client;
  };

  return RedisQueue;

})(events.EventEmitter);

module.exports = RedisQueue;
