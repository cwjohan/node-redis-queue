'use strict'
myWorkQueue1 = null
myWorkQueue2 = null
myBroker = null
queuesActive = 0

WorkQueueBroker = require '../../lib/workQueueBroker'

myBroker = new WorkQueueBroker()
myBroker.connect () ->
  console.log 'work queue broker ready'
  initEventHandlers()
  createWorkQueues()
  subscribeToQueues()
  console.log 'waiting for data...'

initEventHandlers = ->
  myBroker.on 'error', (error) ->
    console.log '>>>' + error
    end()
  myBroker.on 'end', ->
    console.log '>>>End Redis connection'

createWorkQueues = ->
  myWorkQueue1 = myBroker.createQueue 'work-queue-1'
  myWorkQueue2 = myBroker.createQueue 'work-queue-2'
  queuesActive = 2

subscribeToQueues = ->
  console.log 'subscribing to queue "test-queue-1"'
  myWorkQueue1.subscribe (payload, ack) ->
    console.log 'received message "' + payload + '" in queue "work-queue-1"'
    end() if payload is '***stop***' and --queuesActive is 0
    ack()

  console.log 'subscribing to queue "test-queue-2"'
  myWorkQueue2.subscribe (payload, ack) ->
    console.log 'received message "' + payload + '" in queue "work-queue-2"'
    done() if payload is '***stop***' and --queuesActive is 0
    ack()

done = ->
  console.log 'quitting'
  myBroker.end()
  process.exit()

