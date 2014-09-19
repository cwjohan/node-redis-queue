'use strict'
events = require 'events'

class RedisQueueError extends Error

class RedisQueue extends events.EventEmitter
  constructor: (@client, @timeout = 2) ->
    @stop = false
    @client.on 'error', (err) =>
      @stop = true
      @emit 'error', err
    @client.on 'end', () =>
      @stop = true
      @emit 'end'

  push: (key, payload) ->
    @client.lpush key, JSON.stringify(payload)

  monitor: (keysToMonitor...) ->
    @client.brpop keysToMonitor..., @timeout, (err, replies) =>
      if err?
        @emit 'error', err
      else
        if replies? and replies instanceof Array and replies.length is 2
          @emit 'message', replies[0], JSON.parse replies[1]
        else
          if replies?
            @emit new RedisQueueError 'Replies not Array of two elements'
          else
            @emit 'timeout'
      
      @monitor keysToMonitor... unless @stop

  clear: (keysToClear...) ->
    @client.del keysToClear...

  stopMonitoring: () ->
    @stop = true

module.exports = RedisQueue
