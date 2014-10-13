'use strict'
events = require 'events'

RedisQueue = require './index'

class WorkQueue
  constructor: (@qmgr, @queueName, @options) ->
    return this

  subscribe: (@onJob) ->
    process.nextTick => @qmgr.pop @queueName
    return this

  publish: (payload) ->
    @qmgr.push @queueName, payload
    return this

  unsubscribe: ->
    @onJob = null
    return this

  clear: (onClearComplete) ->
    @qmgr.clear @queueName, onClearComplete
    return this

class WorkQueueBrokerError extends Error

class WorkQueueBroker extends events.EventEmitter
  constructor: ->
    @queues = {}
    @qmgr = new RedisQueue()
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
    @qmgr.on 'message', (queueName, payload) =>
      if @isValidQueueName(queueName) and @queues[queueName].onJob
        @queues[queueName].onJob payload, @qmgr.pop.bind @qmgr, queueName
    
  createQueue: (queueName, options) ->
    return @queues[queueName] = new WorkQueue @qmgr, queueName, options

  publish: (queueName, payload) ->
    if @isValidQueueName
      @queues[queueName].publish payload
    return this

  subscribe: (queueName, onJob) ->
    if @isValidQueueName queueName
      @queues[queueName].subscribe onJob
    return this

  unsubscribe: (queueName) ->
    if @isValidQueueName queueName
      @queues[queueName].onJob = null
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

module.exports = WorkQueueBroker

