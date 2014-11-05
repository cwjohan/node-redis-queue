'use strict'
events = require 'events'

Channel = require('..').Channel

class WorkQueue
  constructor: (@queueName, @send_, @consume_, @clear, @destroy_) ->
    return this

  send: (data) ->
    @send_ data
    return this

  consume: (onData, arity) ->
    @consume_ onData, arity
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

  attach: (@client) ->
    @channel.attach @client
    @initEmitters_()

  initEmitters_: ->
    @channel.on 'ready', =>
      @emit 'ready'
    @channel.on 'error', (err) =>
      @emit 'error', err
    @channel.on 'timeout', =>
      @emit 'timeout'
    @channel.on 'end', =>
      @emit 'end'
    
  createQueue: (queueName, options) ->
    return @queues[queueName] = new WorkQueue queueName,
                                  @send.bind(this, queueName),
                                  @consume.bind(this, queueName),
                                  @channel.clear.bind(@channel, queueName),
                                  @destroyQueue.bind(this, queueName)

  send: (queueName, data) ->
    @ensureValidQueueName queueName
    @channel.push queueName, data
    return this

  consume: (queueName, onData, arity = 1) ->
    @ensureValidQueueName queueName
    @consumingNames.push queueName unless @consumingCB[queueName]
    @consumingCB[queueName] = onData
    process.nextTick =>
      @monitor_() while arity--
    return this

  ack_: (queueName, cancel) ->
    if cancel
      @stopConsuming_ queueName
    else
      @monitor_()
    return this

  monitor_: () ->
    (args = @consumingNames.slice()).push (queueName, data) =>
      @consumingCB[queueName] data, @ack_.bind(this, queueName) if @consumingCB[queueName]
    @channel.popAny.apply @channel, args

  stopConsuming_: (queueName) ->
    @consumingNames = @consumingNames.reduce (acc,x) ->
      acc.push x unless x is queueName
      return acc
    , []
    delete @consumingCB[queueName]
    return this
 
  destroyQueue: (queueName) ->
    @ensureValidQueueName queueName
    @stopConsuming_ queueName if @consumingCB[queueName]
    delete @queues[queueName]
    return this

  disconnect: ->
    @channel.disconnect()
    return true

  end: ->
    @channel.end()
    return true

  shutdownSoon: ->
    @channel.shutdownSoon()

  isValidQueueName: (queueName) ->
    return @queues[queueName]?

  ensureValidQueueName: (queueName) ->
    unless @queues[queueName]
      throw (new WorkQueueMgrError 'Unknown queue "' + queueName + '"')
    return

  commandQueueLength: ->
    @channel.commandQueueLength()

exports.queue = WorkQueue
exports.mgr = WorkQueueMgr

