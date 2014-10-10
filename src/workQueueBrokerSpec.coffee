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

WorkQueueBroker = require './workQueueBroker'

describe 'WorkQueueBroker', () ->
  it 'must connect to redis-server', (done) ->
    myBroker = new WorkQueueBroker()
    myBroker.connect () ->
      console.log 'work queue broker ready'
      myBroker.on 'error', (error) ->
        console.log '>>>' + error
        process.exit()
      myBroker.on 'end', ->
        console.log '>>>End Redis connection'
      done()

  it 'creates and clears a queue with no problem', (done) ->
    myWorkQueue1 = myBroker.createQueue 'work-queue-1'
    expect(typeof myWorkQueue1.subscribe).toEqual('function')
    myWorkQueue2 = myBroker.createQueue 'work-queue-2'
    expect(typeof myWorkQueue2.subscribe).toEqual('function')
    clearCnt = 0
    myWorkQueue1.clear () ->
      console.log 'Cleared "work-queue-1"'
      done() if ++clearCnt >= 2
    myWorkQueue2.clear () ->
      console.log 'Cleared "work-queue-2"'
      done() if ++clearCnt >= 2

  it 'receives all published data from given queues', (done) ->
    queueDoneCnt = 0
    console.log 'subscribing to queue "test-queue-1"'
    myWorkQueue1.subscribe (payload) ->
      console.log 'received message "' + payload + '" in queue "test-queue-1"'
      expect(payload).toEqual expectedItemsQ1[itemCntQ1++]
      if itemCntQ1 >= expectedItemsQ1.length
        done() if ++queueDoneCnt >= 2
        return false
      return true

    console.log 'subscribing to queue "test-queue-2"'
    myWorkQueue2.subscribe (payload) ->
      console.log 'received message "' + payload + '" in queue "test-queue-2"'
      expect(payload).toEqual expectedItemsQ2[itemCntQ2++]
      if itemCntQ2 >= expectedItemsQ2.length
        done() if ++queueDoneCnt >= 2
        return false
      return true

    for item in expectedItemsQ1
      console.log 'publishing "' + item + '" to queue "test-queue-1"'
      myWorkQueue1.publish item

    for item in expectedItemsQ2
      console.log 'publishing "' + item + '" to queue "test-queue-2"'
      myWorkQueue2.publish item

    myBroker.begin()

  it 'quits Redis cleanly', () ->
    console.log 'Ending work queue broker'
    expect(myBroker.end()).toEqual true

