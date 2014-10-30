'use strict';

var QueueMgr, WorkQueue, WorkQueueBroker, WorkQueueBrokerError, events,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

events = require('events');

QueueMgr = require('..').QueueMgr;

WorkQueue = (function() {

  function WorkQueue(qmgr, queueName, options, consume_) {
    this.qmgr = qmgr;
    this.queueName = queueName;
    this.options = options;
    this.consume_ = consume_;
    return this;
  }

  WorkQueue.prototype.consume = function(onData) {
    this.consume_(this.queueName, onData);
    return this;
  };

  WorkQueue.prototype.send = function(data) {
    this.qmgr.push(this.queueName, data);
    return this;
  };

  WorkQueue.prototype.clear = function(onClearComplete) {
    this.qmgr.clear(this.queueName, onClearComplete);
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
    return this;
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
    return this.queues[queueName] = new WorkQueue(this.qmgr, queueName, options, this.consume.bind(this));
  };

  WorkQueueBroker.prototype.send = function(queueName, data) {
    if (this.isValidQueueName) {
      this.qmgr.push(this.queueName, data);
    }
    return this;
  };

  WorkQueueBroker.prototype.consume = function(queueName, onData) {
    if (!this.consumingCB[queueName]) {
      this.consumingNames.push(queueName);
    }
    this.consumingCB[queueName] = onData;
    process.nextTick(this.monitor_.bind(this));
    return this;
  };

  WorkQueueBroker.prototype.ack_ = function(queueName, cancel) {
    if (cancel) {
      this.destroyQueue(queueName);
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

  WorkQueueBroker.prototype.destroyQueue = function(queueName) {
    this.consumingNames = this.consumingNames.reduce(function(acc, x) {
      if (x !== queueName) {
        acc.push(x);
      }
      return acc;
    }, []);
    delete this.consumingCB[queueName];
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
    if (this.queues[queueName]) {
      return true;
    }
    throw new WorkQueueBrokerError('Unknown queue "' + queueName + '"');
  };

  WorkQueueBroker.prototype.commandQueueLength = function() {
    return this.qmgr.commandQueueLength();
  };

  return WorkQueueBroker;

})(events.EventEmitter);

exports.queue = WorkQueue;

exports.broker = WorkQueueBroker;
