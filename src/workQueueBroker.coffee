'use strict'
events = require 'events'

QueueMgr = require('..').QueueMgr

class WorkQueue
  constructor: (@queueName, @send_, @consume_, @clear, @destroy_) ->
    return this

  send: (data) ->
    @send_ data
    return this

  consume: (onData) ->
    @consume_ onData
    return this

  clear: (onClearComplete) ->
    @clear_ onClearComplete
    return this

  destroy: ->
    @destroy_()
    return this

class WorkQueueBrokerError extends Error

class WorkQueueBroker extends events.EventEmitter
  constructor: (configFilePath) ->
    @queues = {}
    @consumingCB = {}
    @consumingNames = []
    @qmgr = new QueueMgr(configFilePath)
    return this

  connect: (onReady) ->
    @qmgr.connect onReady
    @initEmitters_()
    return this

  attach: (@client) ->
    @qmgr.attach @client
    @initEmitters_()

  initEmitters_: ->
    @qmgr.on 'ready', =>
      @emit 'ready'
    @qmgr.on 'error', (err) =>
      @emit 'error', err
    @qmgr.on 'timeout', =>
      @emit 'timeout'
    @qmgr.on 'end', =>
      @emit 'end'
    
  createQueue: (queueName, options) ->
    return @queues[queueName] = new WorkQueue queueName,
                                  @send.bind(this, queueName),
                                  @consume.bind(this, queueName),
                                  @qmgr.clear.bind(@qmgr, queueName),
                                  @destroyQueue.bind(this, queueName)

  send: (queueName, data) ->
    @ensureValidQueueName queueName
    @qmgr.push queueName, data
    return this

  consume: (queueName, onData) ->
    @ensureValidQueueName queueName
    @consumingNames.push queueName unless @consumingCB[queueName]
    @consumingCB[queueName] = onData
    process.nextTick @monitor_.bind(this)
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
    @qmgr.popAny.apply @qmgr, args

  stopConsuming_: (queueName) ->
    @consumingNames = @consumingNames.reduce (acc,x) ->
      acc.push x unless x is queueName
      return acc
    , []
    delete @consumingCB[queueName]
    return this
 
  destroyQueue: (queueName) ->
    @ensureValidQueueName queueName
    @stopConsuming queueName if @consumingCB[queueName]
    delete @queues[queueName]
    return this

  disconnect: ->
    @qmgr.disconnect()
    return true

  end: ->
    @qmgr.end()
    return true

  shutdownSoon: ->
    @qmgr.shutdownSoon()

  isValidQueueName: (queueName) ->
    return @queues[queueName]?

  ensureValidQueueName: (queueName) ->
    unless @queues[queueName]
      throw (new WorkQueueBrokerError 'Unknown queue "' + queueName + '"')
    return

  commandQueueLength: ->
    @qmgr.commandQueueLength()

exports.queue = WorkQueue
exports.broker = WorkQueueBroker

