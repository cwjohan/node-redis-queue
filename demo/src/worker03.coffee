'use strict'
###
WorkQueueBroker Example -- worker03

This program consumes two work queues: 'work-queue-1' and 'work-queue-2'.
It simply prints each message consumed and then "acks" it, so that the
next message will become available. Each work queue operates independently.

Usage:
  cd demo/lib
  export NODE_PATH='../../..'
  node worker03.js

Use this program in conjunction with provider03. See provider03 source code
for more details.
###
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

