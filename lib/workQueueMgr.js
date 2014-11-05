'use strict';

var Channel, WorkQueue, WorkQueueMgr, WorkQueueMgrError, events,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

events = require('events');

Channel = require('..').Channel;

WorkQueue = (function() {

  function WorkQueue(queueName, send_, consume_, clear, destroy_) {
    this.queueName = queueName;
    this.send_ = send_;
    this.consume_ = consume_;
    this.clear = clear;
    this.destroy_ = destroy_;
    return this;
  }

  WorkQueue.prototype.send = function(data) {
    this.send_(data);
    return this;
  };

  WorkQueue.prototype.consume = function(onData, arity) {
    this.consume_(onData, arity);
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
    this.channel.on('ready', function() {
      return _this.emit('ready');
    });
    this.channel.on('error', function(err) {
      return _this.emit('error', err);
    });
    this.channel.on('timeout', function() {
      return _this.emit('timeout');
    });
    return this.channel.on('end', function() {
      return _this.emit('end');
    });
  };

  WorkQueueMgr.prototype.createQueue = function(queueName, options) {
    return this.queues[queueName] = new WorkQueue(queueName, this.send.bind(this, queueName), this.consume.bind(this, queueName), this.channel.clear.bind(this.channel, queueName), this.destroyQueue.bind(this, queueName));
  };

  WorkQueueMgr.prototype.send = function(queueName, data) {
    this.ensureValidQueueName(queueName);
    this.channel.push(queueName, data);
    return this;
  };

  WorkQueueMgr.prototype.consume = function(queueName, onData, arity) {
    var _this = this;
    if (arity == null) {
      arity = 1;
    }
    this.ensureValidQueueName(queueName);
    if (!this.consumingCB[queueName]) {
      this.consumingNames.push(queueName);
    }
    this.consumingCB[queueName] = onData;
    process.nextTick(function() {
      var _results;
      _results = [];
      while (arity--) {
        _results.push(_this.monitor_());
      }
      return _results;
    });
    return this;
  };

  WorkQueueMgr.prototype.ack_ = function(queueName, cancel) {
    if (cancel) {
      this.stopConsuming_(queueName);
    } else {
      this.monitor_();
    }
    return this;
  };

  WorkQueueMgr.prototype.monitor_ = function() {
    var args,
      _this = this;
    (args = this.consumingNames.slice()).push(function(queueName, data) {
      if (_this.consumingCB[queueName]) {
        return _this.consumingCB[queueName](data, _this.ack_.bind(_this, queueName));
      }
    });
    return this.channel.popAny.apply(this.channel, args);
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

  WorkQueueMgr.prototype.destroyQueue = function(queueName) {
    this.ensureValidQueueName(queueName);
    if (this.consumingCB[queueName]) {
      this.stopConsuming_(queueName);
    }
    delete this.queues[queueName];
    return this;
  };

  WorkQueueMgr.prototype.disconnect = function() {
    this.channel.disconnect();
    return true;
  };

  WorkQueueMgr.prototype.end = function() {
    this.channel.end();
    return true;
  };

  WorkQueueMgr.prototype.shutdownSoon = function() {
    return this.channel.shutdownSoon();
  };

  WorkQueueMgr.prototype.isValidQueueName = function(queueName) {
    return this.queues[queueName] != null;
  };

  WorkQueueMgr.prototype.ensureValidQueueName = function(queueName) {
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
