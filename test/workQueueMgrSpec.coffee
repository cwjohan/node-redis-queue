'use strict'
queue1 = null
queue2 = null
queue1Name = 'test:work-queue-1'
queue2Name = 'test:work-queue-2'
mgr = null
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

WorkQueueMgr = require('..').WorkQueueMgr
expect = (require 'chai').expect
debug = process.env.DEBUG
verbose = debug || process.env.VERBOSE

describe '===WorkQueueMgr send/consume===', ->
  @timeout 3000 ## 3 seconds
  it 'must connect to redis-server', (done) ->
    mgr = new WorkQueueMgr()
    mgr.connect ->
      console.log 'work queue manager ready' if verbose
      mgr.on 'error', (error) ->
        console.log '>>>' + error
        throw error if error instanceof Error
        process.exit()
      mgr.on 'end', ->
        console.log '>>>End WorkQueueMgr connection'
      done()

  it 'creates and clears two queues with no problem', (done) ->
    queue1 = mgr.createQueue queue1Name
    expect(queue1.queueName).to.equal(queue1Name)
    queue2 = mgr.createQueue queue2Name
    expect(queue2.queueName).to.equal(queue2Name)
    queuesToClear = 2
    queue1.clear ->
      console.log 'Cleared "' + queue1Name + '"' if verbose
      done() unless --queuesToClear
    queue2.clear ->
      console.log 'Cleared "' + queue2Name + '"' if verbose
      done() unless --queuesToClear

  it 'receives all published data from given queues', (done) ->
    itemsInQueues = 0

    for item in expectedItemsQ1
      console.log 'publishing "' + item + '" to queue "' + queue1Name + '"' \
        if verbose
      queue1.send item
      ++itemsInQueues

    for item in expectedItemsQ2
      console.log 'publishing "' + item + '" to queue "' + queue2Name + '"' \
        if verbose
      queue2.send item
      ++itemsInQueues

    console.log 'consuming queue "' + queue1.queueName + '"' if verbose
    itemCntQ1 = 0
    queue1.consume (data, ack) ->
      console.log 'received message "' + data + '" in queue "' + queue1Name + '"' \
        if verbose
      expect(data).to.equal expectedItemsQ1[itemCntQ1++]
      done() unless --itemsInQueues
      ack itemCntQ1 >= expectedItemsQ1.length

    console.log 'consuming queue "' + queue2.queueName + '"' if verbose
    itemCntQ2 = 0
    queue2.consume (data, ack) ->
      console.log 'received message "' + data + '" in queue "' + queue2Name + '"' \
        if verbose
      expect(data).to.equal expectedItemsQ2[itemCntQ2++]
      done() unless --itemsInQueues
      ack itemCntQ2 >= expectedItemsQ2.length

  it 'consume must time out if timeout specified and queue empty', (done) ->
    mgr.once 'timeout', (keys, cancel) ->
      console.log 'consume timed out, key=', keys if verbose
      expect(keys).to.equal(queue1Name)
      cancel() ## prevents outstanding popAnyTimeout
      done()

    queue1.consume (data, ack) ->
      console.log '>>>SHOULD NOT GET HERE, data=', data
      ack()
      return
    , 1, 1

  it 'must be able to schedule multiple async jobs in parallel', (done) ->
    for item in expectedItemsQ1
      console.log 'sending ' + item if verbose
      queue1.send item

    arity = 3
    parallelCnt = maxCnt = itemsProcessed = 0
    queue1.consume (data, ack) ->
      console.log 'processing ' + data if verbose
      maxCnt = Math.max ++parallelCnt, maxCnt
      setTimeout ->
        console.log 'processed ' + data if verbose
        --parallelCnt
        if ++itemsProcessed is expectedItemsQ1.length
          expect(maxCnt).to.equal arity
          ack(true)
          console.log 'outstanding popAnyTimeout operations=' + mgr.channel.outstanding if verbose
          done()
        else
          ack()
      , 10
    , arity

  it 'send/consume throw error if queue no longer exists', ->
    queue1.destroy()
    expect( () ->
      queue1.send 'foo'
    ).to.throw('Unknown queue "' + queue1Name + '"')
    expect( () ->
      queue1.consume -> return
    ).to.throw('Unknown queue "' + queue1Name + '"')

  it 'quits Redis cleanly', ->
    # We don't need to call process exit because the process will quit if no outstanding i/o.
    console.log 'Ending work queue manager test' if verbose
    expect(mgr.end()).to.be.an 'object'

