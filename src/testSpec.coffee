'use strict'
RedisQueue = require '..'
redisQueueTimeout = 0
redisClient = null
myQueue = null
expectedItems = [
    'item one',
    'item two',
    'item three',
]
itemCnt = 0

describe 'RedisQueue', () ->
  it 'must connect to redis-server', (done) ->
    configurator = require './redisQueueConfig'
    config = configurator.getConfig()
    redisClient = configurator.getClient(config)
    expect(redisClient).toBeDefined()
    done()

  it 'constructor must return a queue object', (done) ->
    myQueue = new RedisQueue redisClient, redisQueueTimeout
    expect(typeof myQueue).toEqual 'object'

    myQueue.on 'error', (error) ->
      console.log '>>>' + error
      process.exit()

    myQueue.clear 'test-queue', () ->
      console.log 'Cleared "test-queue"'
      done()

  it 'must retrieve pushed items in correct order', (done) ->
    myQueue.on 'message', (queueName, payload) ->
      console.log 'Received message "' + payload +
                  '" in queue "' + queueName + '"'
      expect(queueName).toEqual 'test-queue'
      expect(payload).toEqual expectedItems[itemCnt++]
      if itemCnt >= expectedItems.length
        done()
        
    myQueue.on 'timeout', () ->
      console.log '>>>Timeout...'

    myQueue.on 'end', () ->
      console.log '>>>End redis connection'

    for item in expectedItems
      console.log 'Pushing message "' + item + '" to queue "test-queue"'
      myQueue.push 'test-queue', item

    myQueue.monitor 'test-queue'

  it 'quits Redis cleanly', () ->
    console.log 'Quitting redis'
    expect(redisClient.end()).toBeUndefined()

