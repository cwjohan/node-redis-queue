'use strict'
myWorkQueue1 = null
myWorkQueue2 = null
workQueue1Name = 'test-queue-1'
workQueue2Name = 'test-queue-2'
myBroker = null
expectedItemsQ1 = [
    'item one',
    'item two',
    'item three',
]
expectedItemsQ2 = [
    'item foo',
    'item bar',
    'item baz',
]

WorkQueueBroker = require('..').WorkQueueBroker

describe 'WorkQueueBroker send/consume', ->
  it 'must connect to redis-server', (done) ->
    myBroker = new WorkQueueBroker()
    myBroker.connect ->
      console.log 'work queue broker ready'
      myBroker.on 'error', (error) ->
        console.log '>>>' + error
        process.exit()
      myBroker.on 'end', ->
        console.log '>>>End WorkQueueBroker connection'
      done()

  it 'creates and clears a queue with no problem', (done) ->
    myWorkQueue1 = myBroker.createQueue workQueue1Name
    expect(myWorkQueue1.queueName).toEqual(workQueue1Name)
    myWorkQueue2 = myBroker.createQueue workQueue2Name
    expect(myWorkQueue2.queueName).toEqual(workQueue2Name)
    queuesToClear = 2
    myWorkQueue1.clear ->
      console.log 'Cleared "work-queue-1"'
      done() unless --queuesToClear
    myWorkQueue2.clear ->
      console.log 'Cleared "work-queue-2"'
      done() unless --queuesToClear

  it 'receives all published data from given queues', (done) ->
    itemsInQueues = 0

    for item in expectedItemsQ1
      console.log 'publishing "' + item + '" to queue "' + workQueue1Name + '"'
      myWorkQueue1.send item
      ++itemsInQueues

    for item in expectedItemsQ2
      console.log 'publishing "' + item + '" to queue "' + workQueue2Name + '"'
      myWorkQueue2.send item
      ++itemsInQueues

    console.log 'consuming queue "test-queue-1"'
    itemCntQ1 = 0
    myWorkQueue1.consume (data, ack) ->
      console.log 'received message "' + data + '" in queue "' + workQueue1Name + '"'
      expect(data).toEqual expectedItemsQ1[itemCntQ1++]
      done() unless --itemsInQueues
      ack(itemCntQ1 >= expectedItemsQ1.length)

    console.log 'consuming queue "test-queue-2"'
    itemCntQ2 = 0
    myWorkQueue2.consume (data, ack) ->
      console.log 'received message "' + data + '" in queue "' + workQueue2Name + '"'
      expect(data).toEqual expectedItemsQ2[itemCntQ2++]
      done() unless --itemsInQueues
      ack(itemCntQ2 >= expectedItemsQ2.length)

  it 'quits Redis cleanly', ->
    console.log 'Ending work queue broker test'
    expect(myBroker.end()).toEqual true

