'use strict'
events = require 'events'
configurator = require './redisQueueConfig'

class ChannelError extends Error

class Channel extends events.EventEmitter
  constructor: (@configFilePath) ->
    @outstanding = 0

  connect: (onReady) ->
    @readyCntDn_ = 1
    @client = configurator.getClient @configFilePath
    @client.once 'ready', @onReady_.bind this,onReady
    @attach @client
      
  connect2: (onReady) ->
    @readyCntDn_ = 2
    @client = configurator.getClient @configFilePath
    @client.once 'ready', @onReady_.bind this, onReady
    @client2 = configurator.getClient @configFilePath
    @client2.once 'ready', @onReady_.bind this, onReady
    @attach @client, @client2

  onReady_: (onReady) ->
    onReady() if --@readyCntDn_ is 0 and onReady and typeof onReady is 'function'
      
  attach: (@client, @client2) ->
    @client2 = @client unless @client2
    @client.on 'error', (err) =>
      @emit 'error', err
    @client.on 'end', =>
      @emit 'end'
    @client.on 'drain', =>
      @emit 'drain'
    if @client2
      @client2.on 'error', (err) =>
        @emit 'error', err
      @client2.on 'end', =>
        @emit 'end'
      @client2.on 'drain', =>
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
    @client2.quit() unless @client is @client2
    return this

  end: ->
    @client.end()
    @client2.end() unless @client is @client2
    return this

  shutdownSoon: (delay) ->
    process.nextTick =>
      if @client2.offline_queue.length is 0
        @end()
      else
        setTimeout =>
          @shutdownSoon delay
        , delay or 500
    return this

  commandQueueLength: ->
    @client.command_queue.length

exports.channel = Channel
