'use strict';

var QueueMgr, WorkQueue, WorkQueueBroker, WorkQueueBrokerError, events,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

events = require('events');

QueueMgr = require('..').QueueMgr;

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

WorkQueueBrokerError = (function(_super) {

  __extends(WorkQueueBrokerError, _super);

  function WorkQueueBrokerError() {
    return WorkQueueBrokerError.__super__.constructor.apply(this, arguments);
  }

  return WorkQueueBrokerError;

})(Error);

WorkQueueBroker = (function(_super) {

  __extends(WorkQueueBroker, _super);

  function WorkQueueBroker(configFilePath) {
    this.queues = {};
    this.consumingCB = {};
    this.consumingNames = [];
    this.qmgr = new QueueMgr(configFilePath);
  }

  WorkQueueBroker.prototype.connect = function(onReady) {
    this.qmgr.connect(onReady);
    this.initEmitters_();
    return this;
  };

  WorkQueueBroker.prototype.attach = function(client) {
    this.client = client;
    this.qmgr.attach(this.client);
    return this.initEmitters_();
  };

  WorkQueueBroker.prototype.initEmitters_ = function() {
    var _this = this;
    this.qmgr.on('ready', function() {
      return _this.emit('ready');
    });
    this.qmgr.on('error', function(err) {
      return _this.emit('error', err);
    });
    this.qmgr.on('timeout', function() {
      return _this.emit('timeout');
    });
    return this.qmgr.on('end', function() {
      return _this.emit('end');
    });
  };

  WorkQueueBroker.prototype.createQueue = function(queueName, options) {
    return this.queues[queueName] = new WorkQueue(queueName, this.send.bind(this, queueName), this.consume.bind(this, queueName), this.qmgr.clear.bind(this.qmgr, queueName), this.destroyQueue.bind(this, queueName));
  };

  WorkQueueBroker.prototype.send = function(queueName, data) {
    this.ensureValidQueueName(queueName);
    this.qmgr.push(queueName, data);
    return this;
  };

  WorkQueueBroker.prototype.consume = function(queueName, onData, arity) {
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

  WorkQueueBroker.prototype.ack_ = function(queueName, cancel) {
    if (cancel) {
      this.stopConsuming_(queueName);
    } else {
      this.monitor_();
    }
    return this;
  };

  WorkQueueBroker.prototype.monitor_ = function() {
    var args,
      _this = this;
    (args = this.consumingNames.slice()).push(function(queueName, data) {
      if (_this.consumingCB[queueName]) {
        return _this.consumingCB[queueName](data, _this.ack_.bind(_this, queueName));
      }
    });
    return this.qmgr.popAny.apply(this.qmgr, args);
  };

  WorkQueueBroker.prototype.stopConsuming_ = function(queueName) {
    this.consumingNames = this.consumingNames.reduce(function(acc, x) {
      if (x !== queueName) {
        acc.push(x);
      }
      return acc;
    }, []);
    delete this.consumingCB[queueName];
    return this;
  };

  WorkQueueBroker.prototype.destroyQueue = function(queueName) {
    this.ensureValidQueueName(queueName);
    if (this.consumingCB[queueName]) {
      this.stopConsuming_(queueName);
    }
    delete this.queues[queueName];
    return this;
  };

  WorkQueueBroker.prototype.disconnect = function() {
    this.qmgr.disconnect();
    return true;
  };

  WorkQueueBroker.prototype.end = function() {
    this.qmgr.end();
    return true;
  };

  WorkQueueBroker.prototype.shutdownSoon = function() {
    return this.qmgr.shutdownSoon();
  };

  WorkQueueBroker.prototype.isValidQueueName = function(queueName) {
    return this.queues[queueName] != null;
  };

  WorkQueueBroker.prototype.ensureValidQueueName = function(queueName) {
    if (!this.queues[queueName]) {
      throw new WorkQueueBrokerError('Unknown queue "' + queueName + '"');
    }
  };

  WorkQueueBroker.prototype.commandQueueLength = function() {
    return this.qmgr.commandQueueLength();
  };

  return WorkQueueBroker;

})(events.EventEmitter);

exports.queue = WorkQueue;

exports.broker = WorkQueueBroker;
