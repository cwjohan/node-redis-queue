'use strict';

var Channel, WorkQueue, WorkQueueMgr, WorkQueueMgrError, events,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

events = require('events');

Channel = require('..').Channel;

WorkQueue = (function() {

  function WorkQueue(queueName, send_, consume_, clear_, destroy_) {
    this.queueName = queueName;
    this.send_ = send_;
    this.consume_ = consume_;
    this.clear_ = clear_;
    this.destroy_ = destroy_;
    return this;
  }

  WorkQueue.prototype.send = function(data) {
    this.send_(data);
    return this;
  };

  WorkQueue.prototype.consume = function(onData, arity, timeout) {
    this.consume_(onData, arity, timeout);
    return this;
  };

  WorkQueue.prototype.clear = function(onClearComplete) {
    this.clear_(onClearComplete);
    return this;
  };

  WorkQueue.prototype.destroy = function() {
    this.destroy_();
    return this;
  };

  return WorkQueue;

})();

WorkQueueMgrError = (function(_super) {

  __extends(WorkQueueMgrError, _super);

  function WorkQueueMgrError() {
    return WorkQueueMgrError.__super__.constructor.apply(this, arguments);
  }

  return WorkQueueMgrError;

})(Error);

WorkQueueMgr = (function(_super) {

  __extends(WorkQueueMgr, _super);

  function WorkQueueMgr(configFilePath) {
    this.queues = {};
    this.consumingCB = {};
    this.consumingNames = [];
    this.channel = new Channel(configFilePath);
  }

  WorkQueueMgr.prototype.connect = function(onReady) {
    this.channel.connect(onReady);
    this.initEmitters_();
    return this;
  };

  WorkQueueMgr.prototype.attach = function(client) {
    this.client = client;
    this.channel.attach(this.client);
    return this.initEmitters_();
  };

  WorkQueueMgr.prototype.initEmitters_ = function() {
    var _this = this;
    this.channel.on('timeout', function(keys, cancel) {
      return _this.emit('timeout', keys, cancel);
    });
    this.channel.on('ready', function() {
      return _this.emit('ready');
    });
    this.channel.on('error', function(err) {
      return _this.emit('error', err);
    });
    this.channel.on('end', function() {
      return _this.emit('end');
    });
    this.channel.on('drain', function() {
      return _this.emit('drain');
    });
    return this;
  };

  WorkQueueMgr.prototype.createQueue = function(queueName, options) {
    return this.queues[queueName] = new WorkQueue(queueName, this.send_.bind(this, queueName), this.consume_.bind(this, queueName), this.channel.clear.bind(this.channel, queueName), this.destroyQueue_.bind(this, queueName));
  };

  WorkQueueMgr.prototype.send_ = function(queueName, data) {
    this.ensureValidQueueName_(queueName);
    this.channel.push(queueName, data);
    return this;
  };

  WorkQueueMgr.prototype.consume_ = function(queueName, onData, arity, timeout) {
    var _this = this;
    if (arity == null) {
      arity = 1;
    }
    if (timeout == null) {
      timeout = 0;
    }
    this.ensureValidQueueName_(queueName);
    if (!this.consumingCB[queueName]) {
      this.consumingNames.push(queueName);
    }
    this.consumingCB[queueName] = onData;
    process.nextTick(function() {
      var _results;
      _results = [];
      while (arity--) {
        _results.push(_this.monitor_(timeout));
      }
      return _results;
    });
    return this;
  };

  WorkQueueMgr.prototype.ack_ = function(queueName, data, timeout, cancel, newTimeout) {
    if (cancel) {
      this.stopConsuming_(queueName);
    } else {
      if (newTimeout != null) {
        timeout = newTimeout;
      }
      this.monitor_(timeout);
    }
    return this;
  };

  WorkQueueMgr.prototype.monitor_ = function(timeout) {
    var args,
      _this = this;
    (args = this.consumingNames.slice()).push(timeout, function(queueName, data) {
      if ((queueName != null) && _this.consumingCB[queueName]) {
        _this.consumingCB[queueName](data, _this.ack_.bind(_this, queueName, data, timeout));
      }
    });
    return this.channel.popAnyTimeout.apply(this.channel, args);
  };

  WorkQueueMgr.prototype.stopConsuming_ = function(queueName) {
    this.consumingNames = this.consumingNames.reduce(function(acc, x) {
      if (x !== queueName) {
        acc.push(x);
      }
      return acc;
    }, []);
    delete this.consumingCB[queueName];
    return this;
  };

  WorkQueueMgr.prototype.clear = function() {
    var keysToClear, onClear, _i, _ref;
    keysToClear = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), onClear = arguments[_i++];
    (_ref = this.channel).clear.apply(_ref, __slice.call(keysToClear).concat([onClear]));
    return this;
  };

  WorkQueueMgr.prototype.destroyQueue_ = function(queueName) {
    this.ensureValidQueueName_(queueName);
    if (this.consumingCB[queueName]) {
      this.stopConsuming_(queueName);
    }
    delete this.queues[queueName];
    return this;
  };

  WorkQueueMgr.prototype.disconnect = function() {
    this.channel.disconnect();
    return this;
  };

  WorkQueueMgr.prototype.end = function() {
    this.channel.end();
    return this;
  };

  WorkQueueMgr.prototype.shutdownSoon = function() {
    return this.channel.shutdownSoon();
  };

  WorkQueueMgr.prototype.ensureValidQueueName_ = function(queueName) {
    if (!this.queues[queueName]) {
      throw new WorkQueueMgrError('Unknown queue "' + queueName + '"');
    }
  };

  WorkQueueMgr.prototype.commandQueueLength = function() {
    return this.channel.commandQueueLength();
  };

  return WorkQueueMgr;

})(events.EventEmitter);

exports.queue = WorkQueue;

exports.mgr = WorkQueueMgr;
