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

 or, to monitor for memory leaks
  node worker03.js mem | grep '>>>'

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
  checkArgs()
  initEventHandlers()
  createWorkQueues()
  consumeData()
  console.log 'waiting for data...'

checkArgs = ->
  if process.argv[2] is 'mem'
    console.log 'monitoring for memory leaks'
    memwatch = require 'memwatch'
    memwatch.on 'stats', (d) ->
      console.log '>>>current = ' + d.current_base + ', max = ' + d.max
    memwatch.on 'leak', (d) ->
      console.log '>>>LEAK = ', d

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
    ack payload is '***stop***'
    myBroker.end() if payload is '***stop***' and --queuesActive is 0

  console.log 'consuming queue "work-queue-2"'
  myWorkQueue2.consume (payload, ack) ->
    console.log 'received message "' + payload + '" in queue "work-queue-2"'
    ack payload is '***stop***'
    myBroker.end() if payload is '***stop***' and --queuesActive is 0

shutDown = ->
  myBroker.end()
  process.exit()

