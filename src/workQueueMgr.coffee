'use strict'
events = require 'events'

Channel = require('..').Channel

class WorkQueue
  constructor: (@queueName, @send_, @consume_, @clear_, @destroy_) ->
    return this

  send: (data) ->
    @send_ data
    return this

  consume: (onData, arity, timeout) ->
    @consume_ onData, arity, timeout
    return this

  clear: (onClearComplete) ->
    @clear_ onClearComplete
    return this

  destroy: ->
    @destroy_()
    return this

class WorkQueueMgrError extends Error

class WorkQueueMgr extends events.EventEmitter
  constructor: (configFilePath) ->
    @queues = {}
    @consumingCB = {}
    @consumingNames = []
    @channel = new Channel(configFilePath)

  connect: (onReady) ->
    @channel.connect onReady
    @initEmitters_()
    return this

  connect2: (onReady) ->
    @channel.connect2 onReady
    @initEmitters_()
    return this

  attach: (@client) ->
    @channel.attach @client
    @initEmitters_()

  initEmitters_: ->
    @channel.on 'timeout', (keys, cancel) =>
      @emit 'timeout', keys, cancel
    @channel.on 'ready', =>
      @emit 'ready'
    @channel.on 'error', (err) =>
      @emit 'error', err
    @channel.on 'end', =>
      @emit 'end'
    @channel.on 'drain', =>
      @emit 'drain'
    return this
    
  createQueue: (queueName, options) ->
    return @queues[queueName] = new WorkQueue queueName,
                                  @send_.bind(this, queueName),
                                  @consume_.bind(this, queueName),
                                  @channel.clear.bind(@channel, queueName),
                                  @destroyQueue_.bind(this, queueName)

  send_: (queueName, data) ->
    @ensureValidQueueName_ queueName
    @channel.push queueName, data
    return this

  consume_: (queueName, onData, arity = 1, timeout = 0) ->
    @ensureValidQueueName_ queueName
    @consumingNames.push queueName unless @consumingCB[queueName]
    @consumingCB[queueName] = onData
    process.nextTick =>
      @monitor_(timeout) while arity--
    return this

  ack_: (queueName, data, timeout, cancel, newTimeout) ->
    if cancel
      @stopConsuming_ queueName
    else
      timeout = newTimeout if newTimeout?
      @monitor_(timeout)
    return this

  monitor_: (timeout) ->
    (args = @consumingNames.slice()).push timeout, (queueName, data) =>
      if queueName? and @consumingCB[queueName]
        @consumingCB[queueName] data, @ack_.bind(this, queueName, data, timeout)
      return

    @channel.popAnyTimeout.apply @channel, args

  stopConsuming_: (queueName) ->
    @consumingNames = @consumingNames.reduce (acc,x) ->
      acc.push x unless x is queueName
      return acc
    , []
    delete @consumingCB[queueName]
    return this

  clear: (keysToClear..., onClear) ->
    @channel.clear keysToClear..., onClear
    return this

  destroyQueue_: (queueName) ->
    @ensureValidQueueName_ queueName
    @stopConsuming_ queueName if @consumingCB[queueName]
    delete @queues[queueName]
    return this

  disconnect: ->
    @channel.disconnect()
    return this

  end: ->
    @channel.end()
    return this

  shutdownSoon: ->
    @channel.shutdownSoon()

  ensureValidQueueName_: (queueName) ->
    unless @queues[queueName]
      throw (new WorkQueueMgrError 'Unknown queue "' + queueName + '"')
    return

  commandQueueLength: ->
    @channel.commandQueueLength()

exports.queue = WorkQueue
exports.mgr = WorkQueueMgr

