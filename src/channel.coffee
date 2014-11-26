'use strict'
events = require 'events'

class ChannelError extends Error

class Channel extends events.EventEmitter
  constructor: (configFilePath) ->
    configFilePath = process.env.QUEUE_CONFIG_FILE or
                     configFilePath or
                     '../redis-queue-config.json'
    @configurator_ = require './redisQueueConfig'
    @config_ = @configurator_.getConfig(configFilePath)
    @outstanding = 0

  connect: (onReady) ->
    @client2 = @client = @configurator_.getClient(@config_)
    @attach @client, onReady
      
  connect2: (onReady) ->
    @client = @configurator_.getClient(@config_)
    @client2 = @configurator_.getClient(@config_)
    @readyCnt_ = 0
    @attach @client, @onReady2_.bind(this, onReady)
    @attach @client, @onReady2_.bind(this, onReady)

  onReady2_: (onReady) ->
    onReady() if ++@readyCnt_ is 2 and onReady and typeof onReady is 'function'
      
  attach: (@client, onReady) ->
    unless @client instanceof Object
      throw new ChannelError 'No client supplied'
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

  push: (queueName, data) ->
    @emit 'error', new ChannelError('push while read outstanding on half-duplex channel') \
      if @outstanding > 0 and @client is @client2
    @client2.lpush queueName, JSON.stringify(data)
    return this

  pop: (queueName, onData) ->
    @popTimeout queueName, 0, onData
    return this

  popTimeout: (queueName, timeout, onData) ->
    ++@outstanding
    @client.brpop queueName, timeout, (err, replies) =>
      --@outstanding
      if err?
        @emit 'error', err ## generally fatal
        return
      if replies?
        if replies instanceof Array and replies.length is 2
          onData(JSON.parse(replies[1])) if onData
          return
        @emit 'error', new ChannelError 'Replies not Array of two elements'
        return
      @cancel = false
      @emit 'timeout', queueName, => @cancel = true
      return if @cancel
      @popTimeout queueName, timeout, onData
    return this

  popAny: (queueNames..., onData) ->
    @popAnyTimeout queueNames..., 0, onData
    return this

  popAnyTimeout: (queueNames..., timeout, onData) ->
    ++@outstanding
    @client.brpop queueNames..., timeout, (err, replies) =>
      --@outstanding
      if err?
        @emit 'error', err ## generally fatal
        return
      if replies?
        if replies instanceof Array and replies.length is 2
          onData(replies[0], JSON.parse(replies[1])) if onData
          return
        @emit 'error', new ChannelError 'Replies not Array of two elements'
        return
      @cancel = false
      @emit 'timeout', queueNames..., => @cancel = true
      return if @cancel
      @popAnyTimeout queueNames..., timeout, onData
    return this

  clear: (queueNamesToClear..., onClear) ->
    @client.del queueNamesToClear..., onClear
    return this

  disconnect: ->
    @client.quit()
    return this

  end: ->
    @client.end()
    return this

  shutdownSoon: (delay) ->
    process.nextTick =>
      if @client.offline_queue.length is 0
        @client.end()
      else
        setTimeout =>
          @shutdownSoon delay
        , delay or 500
    return this

  commandQueueLength: ->
    @client.command_queue.length

exports.channel = Channel
