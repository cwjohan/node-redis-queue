'use strict'
myWorkQueue1 = null
myWorkQueue2 = null
myBroker = null
expectedItemsQ1 = [
    'item one',
    'item two',
    'item three',
]
itemCntQ1 = 0
expectedItemsQ2 = [
    'item foo',
    'item bar',
    'item baz',
]
itemCntQ2 = 0

clear = process.argv[2] is 'clear'
stop = process.argv[2] is 'stop'

WorkQueueBroker = require('node-redis-queue').WorkQueueBroker

myBroker = new WorkQueueBroker()
myBroker.connect () ->
  console.log 'work queue broker ready'
  initEventHandlers()
  createWorkQueues()
  if stop
    sendStop()
    shutDown()
  if clear
    clearWorkQueues ->
      sendData()
      shutDown()
  else
    sendData()
    shutDown()

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

clearWorkQueues = (done) ->
  queuesToClear = 2
  myWorkQueue1.clear () ->
    console.log 'Cleared "work-queue-1"'
    done() unless --queuesToClear
  myWorkQueue2.clear () ->
    console.log 'Cleared "work-queue-2"'
    done() unless --queuesToClear

sendData = ->
  for item in expectedItemsQ1
    console.log 'publishing "' + item + '" to queue "work-queue-1"'
    myWorkQueue1.send item

  for item in expectedItemsQ2
    console.log 'publishing "' + item + '" to queue "work-queue-2"'
    myWorkQueue2.send item

sendStop = ->
  console.log 'stopping worker03'
  myWorkQueue1.send '***stop***'
  myWorkQueue2.send '***stop***'

shutDown = ->
  myBroker.end()
  process.exit()

