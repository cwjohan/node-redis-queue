'use strict'
events = require 'events'

class RedisQueueError extends Error

class RedisQueue extends events.EventEmitter
  constructor: ->
    @configurator = require './redisQueueConfig'
    @config = @configurator.getConfig()
    @stop = false

  connect: (onReady) ->
    @client = @configurator.getClient(@config)
    @attach @client, onReady
      
  attach: (@client, onReady) ->
    unless @client instanceof Object
      throw new RedisQueueError 'No client supplied'
    @client.on 'ready', =>
      @ready = true
      onReady() if onReady and typeof onReady is 'function'
      @emit 'ready'
    @client.on 'error', (err) =>
      @stop = true
      @emit 'error', err
    @client.on 'end', =>
      @ready = false
      @stop = true
      @emit 'end'
    this

  push: (key, payload) ->
    @client.lpush key, JSON.stringify(payload)

  pop: (key) ->
    @client.brpop key, 0, (err, replies) =>
      if err?
        @emit 'error', err
      else
        if replies? and replies instanceof Array and replies.length is 2
          @emit 'message', replies[0], JSON.parse replies[1]
        else
          if replies?
            @emit 'error', new RedisQueueError 'Replies not Array of two elements'

  monitor: (timeout, keysToMonitor...) ->
    @client.brpop keysToMonitor..., timeout, (err, replies) =>
      if err?
        @emit 'error', err
      else
        if replies? and replies instanceof Array and replies.length is 2
          @emit 'message', replies[0], JSON.parse replies[1]
        else
          if replies?
            @emit 'error', new RedisQueueError 'Replies not Array of two elements'
          else
            @emit 'timeout'
      
      @monitor timeout, keysToMonitor... unless @stop

  clear: (keysToClear..., onClear) ->
    @client.del keysToClear..., onClear

  stopMonitoring: ->
    @stop = true

  disconnect: ->
    @client.quit()
    true

  end: ->
    @client.end()
    true

  config: ->
    @config

  client: ->
    @client

module.exports = RedisQueue
