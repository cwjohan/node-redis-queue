'use strict';

var Channel, ChannelError, events,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

events = require('events');

ChannelError = (function(_super) {

  __extends(ChannelError, _super);

  function ChannelError() {
    return ChannelError.__super__.constructor.apply(this, arguments);
  }

  return ChannelError;

})(Error);

Channel = (function(_super) {

  __extends(Channel, _super);

  function Channel(configFilePath) {
    configFilePath = process.env.QUEUE_CONFIG_FILE || configFilePath || '../redis-queue-config.json';
    this.configurator = require('./redisQueueConfig');
    this.config = this.configurator.getConfig(configFilePath);
    this.outstanding = 0;
  }

  Channel.prototype.connect = function(onReady) {
    this.client = this.configurator.getClient(this.config);
    return this.attach(this.client, onReady);
  };

  Channel.prototype.attach = function(client, onReady) {
    var _this = this;
    this.client = client;
    if (!(this.client instanceof Object)) {
      throw new ChannelError('No client supplied');
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

  Channel.prototype.push = function(queueName, data) {
    this.client.lpush(queueName, JSON.stringify(data));
    return this;
  };

  Channel.prototype.pop = function(queueName, onData) {
    this.popTimeout(queueName, 0, onData);
    return this;
  };

  Channel.prototype.popTimeout = function(queueName, timeout, onData) {
    var _this = this;
    ++this.outstanding;
    this.client.brpop(queueName, timeout, function(err, replies) {
      --_this.outstanding;
      if (err != null) {
        _this.emit('error', err);
        return;
      }
      if (replies != null) {
        if (replies instanceof Array && replies.length === 2) {
          if (onData) {
            onData(JSON.parse(replies[1]));
          }
          return;
        }
        _this.emit('error', new ChannelError('Replies not Array of two elements'));
        return;
      }
      _this.cancel = false;
      _this.emit('timeout', queueName, function() {
        return _this.cancel = true;
      });
      if (_this.cancel) {
        return;
      }
      return _this.popTimeout(queueName, timeout, onData);
    });
    return this;
  };

  Channel.prototype.popAny = function() {
    var onData, queueNames, _i;
    queueNames = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), onData = arguments[_i++];
    this.popAnyTimeout.apply(this, __slice.call(queueNames).concat([0], [onData]));
    return this;
  };

  Channel.prototype.popAnyTimeout = function() {
    var onData, queueNames, timeout, _i, _ref,
      _this = this;
    queueNames = 3 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 2) : (_i = 0, []), timeout = arguments[_i++], onData = arguments[_i++];
    ++this.outstanding;
    (_ref = this.client).brpop.apply(_ref, __slice.call(queueNames).concat([timeout], [function(err, replies) {
      --_this.outstanding;
      if (err != null) {
        _this.emit('error', err);
        return;
      }
      if (replies != null) {
        if (replies instanceof Array && replies.length === 2) {
          if (onData) {
            onData(replies[0], JSON.parse(replies[1]));
          }
          return;
        }
        _this.emit('error', new ChannelError('Replies not Array of two elements'));
        return;
      }
      _this.cancel = false;
      _this.emit.apply(_this, ['timeout'].concat(__slice.call(queueNames), [function() {
        return _this.cancel = true;
      }]));
      if (_this.cancel) {
        return;
      }
      return _this.popAnyTimeout.apply(_this, __slice.call(queueNames).concat([timeout], [onData]));
    }]));
    return this;
  };

  Channel.prototype.clear = function() {
    var onClear, queueNamesToClear, _i, _ref;
    queueNamesToClear = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), onClear = arguments[_i++];
    (_ref = this.client).del.apply(_ref, __slice.call(queueNamesToClear).concat([onClear]));
    return this;
  };

  Channel.prototype.disconnect = function() {
    this.client.quit();
    return this;
  };

  Channel.prototype.end = function() {
    this.client.end();
    return this;
  };

  Channel.prototype.shutdownSoon = function(delay) {
    var _this = this;
    process.nextTick(function() {
      if (_this.client.offline_queue.length === 0) {
        return _this.client.end();
      } else {
        return setTimeout(function() {
          return _this.shutdownSoon(delay);
        }, delay || 500);
      }
    });
    return this;
  };

  Channel.prototype.commandQueueLength = function() {
    return this.client.command_queue.length;
  };

  return Channel;

})(events.EventEmitter);

exports.channel = Channel;
