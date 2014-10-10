'use strict'
myWorkQueue1 = null
myWorkQueue2 = null
myBroker = null

WorkQueueBroker = require '../../lib/workQueueBroker'

myBroker = new WorkQueueBroker()
myBroker.connect () ->
  console.log 'work queue broker ready'
  initEventHandlers()
  createWorkQueues()
  subscribeToQueues()
  myBroker.begin()
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

subscribeToQueues = ->
  console.log 'subscribing to queue "test-queue-1"'
  myWorkQueue1.subscribe (payload) ->
    console.log 'received message "' + payload + '" in queue "work-queue-1"'
    end() if payload is '***stop***'
    return true

  console.log 'subscribing to queue "test-queue-2"'
  myWorkQueue2.subscribe (payload) ->
    console.log 'received message "' + payload + '" in queue "work-queue-2"'
    end() if payload is '***stop***'
    return true

end = ->
  console.log 'quitting'
  myBroker.end()
  process.exit()

