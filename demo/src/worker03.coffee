'use strict'
myWorkQueue1 = null
myWorkQueue2 = null
myBroker = null
queuesActive = 0

WorkQueueBroker = require('node-redis-queue').WorkQueueBroker

myBroker = new WorkQueueBroker()
myBroker.connect () ->
  console.log 'work queue broker ready'
  initEventHandlers()
  createWorkQueues()
  consumeData()
  console.log 'waiting for data...'

initEventHandlers = ->
  myBroker.on 'error', (error) ->
    console.log '>>>' + error
    shutDown()
  myBroker.on 'end', ->
    console.log '>>>End Redis connection'
    shutDown()

createWorkQueues = ->
  myWorkQueue1 = myBroker.createQueue 'work-queue-1'
  myWorkQueue2 = myBroker.createQueue 'work-queue-2'
  queuesActive = 2

consumeData = ->
  console.log 'consuming queue "work-queue-1"'
  myWorkQueue1.consume (payload, ack) ->
    console.log 'received message "' + payload + '" in queue "work-queue-1"'
    shutDown() if payload is '***stop***' and --queuesActive is 0
    ack()

  console.log 'consuming queue "work-queue-2"'
  myWorkQueue2.consume (payload, ack) ->
    console.log 'received message "' + payload + '" in queue "work-queue-2"'
    shutDown() if payload is '***stop***' and --queuesActive is 0
    ack()

shutDown = ->
  myBroker.end()
  process.exit()

