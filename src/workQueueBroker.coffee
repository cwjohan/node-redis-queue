'use strict'
events = require 'events'

QueueMgr = require('..').QueueMgr

class WorkQueue
  constructor: (@qmgr, @queueName, @options, @consume_) ->
    return this

  consume: (onData) ->
    @consume_(@queueName, onData)
    return this

  send: (data) ->
    @qmgr.push @queueName, data
    return this

  clear: (onClearComplete) ->
    @qmgr.clear @queueName, onClearComplete
    return this

class WorkQueueBrokerError extends Error

class WorkQueueBroker extends events.EventEmitter
  constructor: (configFilePath) ->
    @queues = {}
    @consuming = {}
    @qmgr = new QueueMgr(configFilePath)
    return this

  connect: (onReady) ->
    @qmgr.connect onReady
    @initEmitters_()
    return this

  attach: (@client, onReady) ->
    @qmgr.attach @client, onReady
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
    return @queues[queueName] = new WorkQueue @qmgr, queueName, options, @consume.bind(this)

  send: (queueName, data) ->
    if @isValidQueueName
      @qmgr.push @queueName, data
    return this

  consume: (queueName, onData) ->
    @consuming[queueName] = onData
    process.nextTick @monitor_.bind(this)
    return this

  ack_: (queueName, cancel) ->
    if cancel
      delete @consuming[queueName]
    else
      @monitor_()
    return this

  monitor_: () ->
    args = Object.keys(@consuming)
    args.push (queueName, data) =>
      @consuming[queueName] data, @ack_.bind(this, queueName) if @consuming[queueName]
    @qmgr.popAny.apply @qmgr, args

  destroyQueue: (queueName) ->
    if @isValidQueueName queueName
      delete @consuming[queueName]
      delete @queues[queueName]
    return this

  disconnect: ->
    @qmgr.disconnect()
    return true

  end: ->
    @qmgr.end()
    return true

  isValidQueueName: (queueName) ->
    return true if @queues[queueName]
    throw new WorkQueueBrokerError('Unknown queue "' + queueName + '"')

exports.queue = WorkQueue
exports.broker = WorkQueueBroker

