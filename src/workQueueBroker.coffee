'use strict'
events = require 'events'

RedisQueue = require './index'

class WorkQueue
  constructor: (@broker, @queueName, @options) ->
    return this

  subscribe: (@onJob) ->
    @broker.subscribe @queueName, @onJob
    return this

  publish: (payload) ->
    @broker.qmgr.push @queueName, payload
    return this

  clear: (onClearComplete) ->
    @broker.qmgr.clear(@queueName, onClearComplete)
    return this

class WorkQueueBrokerError extends Error

class WorkQueueBroker extends events.EventEmitter
  constructor: () ->
    @queues = {}
    @qmgr = new RedisQueue()
    @qmgr.on 'ready', () =>
      @emit 'ready'
    @qmgr.on 'error', (err) =>
      @emit 'error', err
    @qmgr.on 'timeout', () =>
      @emit 'timeout'
    @qmgr.on 'end', () =>
      @emit 'end'
    @qmgr.on 'message', (queueName, payload) =>
      if @isValidQueueName(queueName) and @queues[queueName].onJob
        @queues[queueName].onJob payload
    return this

  connect: (onReady, @client) ->
    @qmgr.on 'ready', onReady
    @qmgr.connect(@client)
    return this

  createQueue: (queueName, options) ->
    return @queues[queueName] = new WorkQueue this, queueName, options

  publish: (queueName, payload) ->
    if @isValidQueueName
      @qmgr[queueName].publish payload
    return this

  subscribe: (queueName, onJob) ->
    if @isValidQueueName queueName
      console.log 'subscribing to "' + queueName + '"'
      @queues[queueName].onJob = onJob
    return this

  unsubscribe: (queueName) ->
    if @isValidQueueName queueName
      @queues[queueName].onJob = null
    return this

  destroyQueue: (queueName) ->
    if @isValidQueueName queueName
      delete @queues[queueName]
    return this

  monitor: (timeout = 1) ->
    args = Object.keys @queues
    throw new WorkQueueBrokerError 'No queues exist' unless args.length > 0
    args.unshift timeout
    @qmgr.monitor.apply @qmgr, args
    return this

  disconnect: () ->
    @qmgr.disconnect()
    return true

  end: () ->
    @qmgr.end()
    return true

  isValidQueueName: (queueName) ->
    unless @queues[queueName]
      throw new WorkQueueBrokerError('Unknown queue "' + queueName + '"')
    return true

module.exports = WorkQueueBroker

