'use strict'
myWorkQueue1 = null
myWorkQueue2 = null
workQueue1Name = 'work-queue-1'
workQueue2Name = 'work-queue-2'
myBroker = null
expectedItemsQ1 = [
    'item one',
    'item two',
    'item three',
    'item four',
    'item five'
]
expectedItemsQ2 = [
    'item foo',
    'item bar',
    'item baz',
]

WorkQueueBroker = require('..').WorkQueueBroker
expect = (require 'chai').expect
debug = process.env.DEBUG
verbose = debug || process.env.VERBOSE

describe '===WorkQueueBroker send/consume===', ->
  it 'must connect to redis-server', (done) ->
    myBroker = new WorkQueueBroker()
    myBroker.connect ->
      console.log 'work queue broker ready' if verbose
      myBroker.on 'error', (error) ->
        console.log '>>>' + error
        throw error if error instanceof Error
        process.exit()
      myBroker.on 'end', ->
        console.log '>>>End WorkQueueBroker connection'
      done()

  it 'creates and clears two queues with no problem', (done) ->
    myWorkQueue1 = myBroker.createQueue workQueue1Name
    expect(myWorkQueue1.queueName).to.equal(workQueue1Name)
    myWorkQueue2 = myBroker.createQueue workQueue2Name
    expect(myWorkQueue2.queueName).to.equal(workQueue2Name)
    queuesToClear = 2
    myWorkQueue1.clear ->
      console.log 'Cleared "' + workQueue1Name + '"' if verbose
      done() unless --queuesToClear
    myWorkQueue2.clear ->
      console.log 'Cleared "' + workQueue2Name + '"' if verbose
      done() unless --queuesToClear

  it 'receives all published data from given queues (no interleaving)', (done) ->
    itemsInQueues = 0

    for item in expectedItemsQ1
      console.log 'publishing "' + item + '" to queue "' + workQueue1Name + '"' \
        if verbose
      myWorkQueue1.send item
      ++itemsInQueues

    for item in expectedItemsQ2
      console.log 'publishing "' + item + '" to queue "' + workQueue2Name + '"' \
        if verbose
      myWorkQueue2.send item
      ++itemsInQueues

    console.log 'consuming queue "test-queue-1"' if verbose
    itemCntQ1 = 0
    myWorkQueue1.consume (data, ack) ->
      console.log 'received message "' + data + '" in queue "' + workQueue1Name + '"' \
        if verbose
      expect(data).to.equal expectedItemsQ1[itemCntQ1++]
      done() unless --itemsInQueues
      ack itemCntQ1 >= expectedItemsQ1.length

    console.log 'consuming queue "test-queue-2"' if verbose
    itemCntQ2 = 0
    myWorkQueue2.consume (data, ack) ->
      console.log 'received message "' + data + '" in queue "' + workQueue2Name + '"' \
        if verbose
      expect(data).to.equal expectedItemsQ2[itemCntQ2++]
      done() unless --itemsInQueues
      ack itemCntQ2 >= expectedItemsQ2.length

  it 'receives all published data from given queues (interleaving)', (done) ->
    itemsInQueues = 0

    for i in [0..Math.max(expectedItemsQ1.length, expectedItemsQ2.length)]
      if i < expectedItemsQ1.length
        console.log 'publishing "' + expectedItemsQ1[i] + '" to queue "' + workQueue1Name +
                    '"' if verbose
        myWorkQueue1.send expectedItemsQ1[i]
        ++itemsInQueues
      if i < expectedItemsQ2.length
        console.log 'publishing "' + expectedItemsQ2[i] + '" to queue "' + workQueue2Name +
                    '"' if verbose
        myWorkQueue2.send expectedItemsQ2[i]
        ++itemsInQueues
    
    console.log 'commandQueueLength = ' + myBroker.commandQueueLength() if verbose
    expect(myBroker.commandQueueLength()).to.be.above(0)
    expect(myBroker.commandQueueLength()).to.be.at.most(itemsInQueues)

    isEven = (n) -> n % 2 is 0

    console.log 'consuming queue "test-queue-1"' if verbose
    itemCntQ1 = 0
    myWorkQueue1.consume (data, ack) ->
      console.log 'received message "' + data + '" in queue "' + workQueue1Name + '"' \
        if verbose
      expect(data).to.equal expectedItemsQ1[itemCntQ1++]
      if isEven(itemCntQ1)
        done() unless --itemsInQueues
        if debug
          console.log '>>>done Q1' unless itemsInQueues
          console.log '>>>ack Q1'
        ack itemCntQ1 >= expectedItemsQ1.length
      else
        setTimeout ->
          done() unless --itemsInQueues
          if debug
            console.log '>>>done Q1' unless itemsInQueues
            console.log '>>>ack Q1 timeout'
          ack itemCntQ1 >= expectedItemsQ1.length
        ,10

    console.log 'consuming queue "test-queue-2"' if verbose
    itemCntQ2 = 0
    myWorkQueue2.consume (data, ack) ->
      console.log 'received message "' + data + '" in queue "' + workQueue2Name +
                  '"'  if verbose
      expect(data).to.equal expectedItemsQ2[itemCntQ2++]
      if isEven(itemCntQ2)
        done() unless --itemsInQueues
        if debug
          console.log '>>>done Q2' unless itemsInQueues
          console.log '>>>ack Q2'
        ack itemCntQ2 >= expectedItemsQ2.length
      else
        setTimeout ->
          done() unless --itemsInQueues
          if debug
            console.log '>>>done Q2' unless itemsInQueues
            console.log '>>>ack Q2 timeout'
          ack itemCntQ2 >= expectedItemsQ2.length
        ,10

  it 'quits Redis cleanly', ->
    console.log 'Ending work queue broker test' if verbose
    expect(myBroker.end()).to.equal true

