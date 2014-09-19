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

  function RedisQueue(conn, timeout) {
    var _this = this;
    this.conn = conn;
    this.timeout = timeout != null ? timeout : 2;
    this.stop = false;
    this.conn.on('error', function(err) {
      _this.stop = true;
      return _this.emit('error', err);
    });
    this.conn.on('end', function() {
      _this.stop = true;
      return _this.emit('end');
    });
  }

  RedisQueue.prototype.push = function(key, payload) {
    return this.conn.lpush(key, JSON.stringify(payload));
  };

  RedisQueue.prototype.monitor = function() {
    var keysToMonitor, _ref,
      _this = this;
    keysToMonitor = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return (_ref = this.conn).brpop.apply(_ref, __slice.call(keysToMonitor).concat([this.timeout], [function(err, replies) {
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
        return _this.monitor.apply(_this, keysToMonitor);
      }
    }]));
  };

  RedisQueue.prototype.clear = function() {
    var keysToClear, _ref;
    keysToClear = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return (_ref = this.conn).del.apply(_ref, keysToClear);
  };

  RedisQueue.prototype.stopMonitoring = function() {
    return this.stop = true;
  };

  return RedisQueue;

})(events.EventEmitter);

module.exports = RedisQueue;
