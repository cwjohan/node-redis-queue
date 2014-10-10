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

  RedisQueue.prototype.connect = function(onReady) {
    this.client = this.configurator.getClient(this.config);
    return this.attach(this.client, onReady);
  };

  RedisQueue.prototype.attach = function(client, onReady) {
    var _this = this;
    this.client = client;
    if (!(this.client instanceof Object)) {
      throw new RedisQueueError('No client supplied');
    }
    this.client.on('ready', function() {
      _this.ready = true;
      if (onReady && typeof onReady === 'function') {
        onReady();
      }
      return _this.emit('ready');
    });
    this.client.on('error', function(err) {
      _this.stop = true;
      return _this.emit('error', err);
    });
    this.client.on('end', function() {
      _this.ready = false;
      _this.stop = true;
      return _this.emit('end');
    });
    return this;
  };

  RedisQueue.prototype.push = function(key, payload) {
    return this.client.lpush(key, JSON.stringify(payload));
  };

  RedisQueue.prototype.pop = function(key) {
    var _this = this;
    return this.client.brpop(key, 0, function(err, replies) {
      if (err != null) {
        return _this.emit('error', err);
      } else {
        if ((replies != null) && replies instanceof Array && replies.length === 2) {
          return _this.emit('message', replies[0], JSON.parse(replies[1]));
        } else {
          if (replies != null) {
            return _this.emit(new RedisQueueError('Replies not Array of two elements'));
          }
        }
      }
    });
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
    var keysToClear, onClear, _i, _ref;
    keysToClear = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), onClear = arguments[_i++];
    return (_ref = this.client).del.apply(_ref, __slice.call(keysToClear).concat([onClear]));
  };

  RedisQueue.prototype.stopMonitoring = function() {
    return this.stop = true;
  };

  RedisQueue.prototype.disconnect = function() {
    this.client.quit();
    return true;
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
