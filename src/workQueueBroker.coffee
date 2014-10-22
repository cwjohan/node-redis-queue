'use strict'
events = require 'events'

QueueMgr = require('..').QueueMgr

class WorkQueue
  constructor: (@qmgr, @queueName, @options) ->
    return this

  ack_: (onData, cancel) ->
    unless cancel
      @consume onData
    return this

  consume: (onData) ->
    @qmgr.pop @queueName, (data) =>
      onData data, @ack_.bind(this, onData)
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
    return @queues[queueName] = new WorkQueue @qmgr, queueName, options

  send: (queueName, data) ->
    if @isValidQueueName
      @queues[queueName].send data
    return this

  consume: (queueName, onData) ->
    if @isValidQueueName queueName
      @queues[queueName].consume onData
    return this

  destroyQueue: (queueName) ->
    if @isValidQueueName queueName
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

