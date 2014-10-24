'use strict';

var QueueMgr, QueueMgrError, events,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

events = require('events');

QueueMgrError = (function(_super) {

  __extends(QueueMgrError, _super);

  function QueueMgrError() {
    return QueueMgrError.__super__.constructor.apply(this, arguments);
  }

  return QueueMgrError;

})(Error);

QueueMgr = (function(_super) {

  __extends(QueueMgr, _super);

  function QueueMgr(configFilePath) {
    configFilePath = process.env.QUEUE_CONFIG_FILE || configFilePath || '../redis-queue-config.json';
    this.configurator = require('./redisQueueConfig');
    this.config = this.configurator.getConfig(configFilePath);
  }

  QueueMgr.prototype.connect = function(onReady) {
    this.client = this.configurator.getClient(this.config);
    return this.attach(this.client, onReady);
  };

  QueueMgr.prototype.attach = function(client, onReady) {
    var _this = this;
    this.client = client;
    if (!(this.client instanceof Object)) {
      throw new QueueMgrError('No client supplied');
    }
    this.client.on('ready', function() {
      _this.ready = true;
      if (onReady && typeof onReady === 'function') {
        onReady();
      }
      return _this.emit('ready');
    });
    this.client.on('error', function(err) {
      return _this.emit('error', err);
    });
    this.client.on('end', function() {
      _this.ready = false;
      return _this.emit('end');
    });
    this.client.on('drain', function() {
      return _this.emit('drain');
    });
    return this;
  };

  QueueMgr.prototype.push = function(key, data) {
    this.client.lpush(key, JSON.stringify(data));
    return this;
  };

  QueueMgr.prototype.pop = function(key, onData) {
    var _this = this;
    this.client.brpop(key, 0, function(err, replies) {
      if (err != null) {
        return _this.emit('error', err);
      } else {
        if ((replies != null) && replies instanceof Array && replies.length === 2) {
          if (onData) {
            return onData(JSON.parse(replies[1]));
          }
        } else {
          if (replies != null) {
            return _this.emit('error', new QueueMgrError('Replies not Array of two elements'));
          }
        }
      }
    });
    return this;
  };

  QueueMgr.prototype.popAny = function() {
    var keys, onData, _i, _ref,
      _this = this;
    keys = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), onData = arguments[_i++];
    (_ref = this.client).brpop.apply(_ref, __slice.call(keys).concat([0], [function(err, replies) {
      if (err != null) {
        return _this.emit('error', err);
      } else {
        if ((replies != null) && replies instanceof Array && replies.length === 2) {
          if (onData) {
            return onData(replies[0], JSON.parse(replies[1]));
          }
        } else {
          if (replies != null) {
            return _this.emit('error', new QueueMgrError('Replies not Array of two elements'));
          }
        }
      }
    }]));
    return this;
  };

  QueueMgr.prototype.clear = function() {
    var keysToClear, onClear, _i, _ref;
    keysToClear = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), onClear = arguments[_i++];
    return (_ref = this.client).del.apply(_ref, __slice.call(keysToClear).concat([onClear]));
  };

  QueueMgr.prototype.disconnect = function() {
    this.client.quit();
    return true;
  };

  QueueMgr.prototype.end = function() {
    this.client.end();
    return true;
  };

  QueueMgr.prototype.config = function() {
    return this.config;
  };

  QueueMgr.prototype.client = function() {
    return this.client;
  };

  return QueueMgr;

})(events.EventEmitter);

exports.qmgr = QueueMgr;
