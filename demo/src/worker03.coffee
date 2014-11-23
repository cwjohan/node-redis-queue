'use strict'
###
WorkQueueMgr Example -- worker03

This program consumes two work queues: 'demo:work-queue-1' and 'demo:work-queue-2'.
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
queue1 = null
queue2 = null
queue1Name = 'demo:work-queue-1'
queue2Name = 'demo:work-queue-2'
mgr = null
queuesActive = 0

WorkQueueMgr = require('node-redis-queue').WorkQueueMgr

mgr = new WorkQueueMgr()
mgr.connect () ->
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
  mgr.on 'error', (error) ->
    console.log '>>>' + error
    shutDown()
  mgr.on 'end', ->
    console.log '>>>End Redis connection'
    shutDown()

createWorkQueues = ->
  queue1 = mgr.createQueue queue1Name
  queue2 = mgr.createQueue queue2Name
  queuesActive = 2
  return

consumeData = ->
  console.log 'consuming queue "' + queue1.queueName + '"'
  queue1.consume (payload, ack) ->
    console.log 'received message "' + payload + '" in queue "' + queue1.queueName + '"'
    ack payload is '***stop***'
    mgr.end() if payload is '***stop***' and --queuesActive is 0

  console.log 'consuming queue "' + queue2.queueName + '"'
  queue2.consume (payload, ack) ->
    console.log 'received message "' + payload + '" in queue "' + queue2.queueName + '"'
    ack payload is '***stop***'
    mgr.end() if payload is '***stop***' and --queuesActive is 0

shutDown = ->
  mgr.end()
  process.exit()

