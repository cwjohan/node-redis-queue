'use strict'
redisQueueTimeout = 1
myWorkQueue = null
myBroker = null
expectedItems = [
    'item one',
    'item two',
    'item three',
]
itemCnt = 0

WorkQueueBroker = require './workQueueBroker'

describe 'WorkQueueBroker', () ->
  it 'must connect to redis-server', (done) ->
    myBroker = new WorkQueueBroker()
    myBroker.connect () ->
      console.log 'work queue broker ready'
      myBroker.on 'error', (error) ->
        console.log '>>>' + error
        process.exit()
      myBroker.on 'timeout', ->
        console.log '>>>timeout'
      myBroker.on 'end', ->
        console.log '>>>End Redis connection'
      done()

  ## it 'creates a queue with no problem', () ->

  it 'receives published data from given queue', (done) ->
    console.log 'creating queue "work-queue"'
    myWorkQueue = myBroker.createQueue 'work-queue'
    expect(typeof myWorkQueue.subscribe).toEqual('function')
    message = 'Hello, World!'

    myWorkQueue.subscribe (payload) ->
      console.log 'receved published payload = "' + payload + '"'
      expect(payload).toEqual(message)
      console.log 'we are done now'
      done()

    console.log 'publishing "' + message + '"'
    myWorkQueue.publish message
    myBroker.monitor(1)

  it 'quits Redis cleanly', () ->
    console.log 'Quitting redis again'
    expect(myBroker.end()).toEqual true
    ## expect(myBroker.disconnect()).toEqual true

###
      myWorkQueue.clear () ->
        console.log 'Cleared "work-queue"'
        done()
###

