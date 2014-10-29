'use strict'
events = require 'events'

class QueueMgrError extends Error

class QueueMgr extends events.EventEmitter
  constructor: (configFilePath) ->
    configFilePath = process.env.QUEUE_CONFIG_FILE or
                     configFilePath or
                     '../redis-queue-config.json'
    @configurator = require './redisQueueConfig'
    @config = @configurator.getConfig(configFilePath)

  connect: (onReady) ->
    @client = @configurator.getClient(@config)
    @attach @client, onReady
      
  attach: (@client, onReady) ->
    unless @client instanceof Object
      throw new QueueMgrError 'No client supplied'
    @client.on 'ready', =>
      @ready = true
      onReady() if onReady and typeof onReady is 'function'
      @emit 'ready'
    @client.on 'error', (err) =>
      @emit 'error', err
    @client.on 'end', =>
      @ready = false
      @emit 'end'
    @client.on 'drain', =>
      @emit 'drain'
    return this

  push: (key, data) ->
    @client.lpush key, JSON.stringify(data)
    return this

  pop: (key, onData) ->
    @client.brpop key, 0, (err, replies) =>
      if err?
        @emit 'error', err
      else
        if replies? and replies instanceof Array and replies.length is 2
          onData(JSON.parse(replies[1])) if onData
        else
          if replies?
            @emit 'error', new QueueMgrError 'Replies not Array of two elements'
    return this

  popAny: (keys..., onData) ->
    @client.brpop keys..., 0, (err, replies) =>
      if err?
        @emit 'error', err
      else
        if replies? and replies instanceof Array and replies.length is 2
          onData(replies[0], JSON.parse(replies[1])) if onData
        else
          if replies?
            @emit 'error', new QueueMgrError 'Replies not Array of two elements'
    return this

  clear: (keysToClear..., onClear) ->
    @client.del keysToClear..., onClear

  disconnect: ->
    @client.quit()
    true

  end: ->
    @client.end()
    true

  shutdownSoon: (delay) ->
    process.nextTick =>
      if @client.offline_queue.length is 0
        @client.end()
      else
        setTimeout =>
          @shutdownSoon delay
        , delay or 500

  commandQueueLength: ->
    @client.command_queue.length

exports.qmgr = QueueMgr
