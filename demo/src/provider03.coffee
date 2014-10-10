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

WorkQueueBroker = require '../../lib/workQueueBroker'

myBroker = new WorkQueueBroker()
myBroker.connect () ->
  console.log 'work queue broker ready'
  initEventHandlers()
  createWorkQueues()
  if stop
    postStop()
    end()
  if clear
    clearWorkQueues ->
      postData()
      end()
  else
    postData()
    end()

initEventHandlers = ->
  myBroker.on 'error', (error) ->
    console.log '>>>' + error
    process.exit()
  myBroker.on 'end', ->
    console.log '>>>End Redis connection'

createWorkQueues = ->
  myWorkQueue1 = myBroker.createQueue 'work-queue-1'
  myWorkQueue2 = myBroker.createQueue 'work-queue-2'

clearWorkQueues = (done) ->
  clearCnt = 0
  myWorkQueue1.clear () ->
    console.log 'Cleared "work-queue-1"'
    done() if ++clearCnt >= 2
  myWorkQueue2.clear () ->
    console.log 'Cleared "work-queue-2"'
    done() if ++clearCnt >= 2

postData = ->
  for item in expectedItemsQ1
    console.log 'publishing "' + item + '" to queue "work-queue-1"'
    myWorkQueue1.publish item

  for item in expectedItemsQ2
    console.log 'publishing "' + item + '" to queue "work-queue-2"'
    myWorkQueue2.publish item

postStop = ->
  console.log 'stopping worker03'
  myWorkQueue1.publish '***stop***'
  myWorkQueue2.publish '***stop***'

end = ->
  console.log 'Ending work queue broker'
  myBroker.end()


