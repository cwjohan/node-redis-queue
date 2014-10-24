'use strict'
QueueMgr = require('..').QueueMgr
qmgr = null
queueName1 = 'test-queue-1'
queueName2 = 'test-queue-2'
expect = (require 'chai').expect
verbose = process.env.VERBOSE

expectedItems1 = [
    'item one',
    'item two',
    'item three',
]

expectedItems2 = [
    'item uno',
    'item dos',
    'item tres',
]

describe '===QueueMgr push/pop===', ->
  it 'must connect to redis-server', (done) ->
    qmgr = new QueueMgr
    qmgr.connect ->
      console.log 'push/pop queue mgr ready' if verbose
      expect(qmgr).to.be.a('object')
      expect(qmgr.push).to.be.a 'function'

      qmgr.on 'error', (error) ->
        console.log '>>>' + error
        throw error if error instanceof Error
        process.exit()
      done()

  it 'must clear test-queues', (done) ->
      queuesToClear = 2
      qmgr.clear queueName1, ->
        console.log 'Cleared "' + queueName1 + '"' if verbose
        done() unless --queuesToClear
      qmgr.clear queueName2, ->
        console.log 'Cleared "' + queueName2 + '"' if verbose
        done() unless --queuesToClear

  it 'must retrieve pushed items in correct order', (done) ->
    qmgr.on 'end', ->
      console.log '>>>End QueueMgr connection'

    for item in expectedItems1
      console.log 'Pushing message "' + item + '" to queue "' + queueName1 + '"' \
        if verbose
      qmgr.push queueName1, item

    itemCnt = 0
    for item in expectedItems1
      qmgr.pop queueName1, (data) ->
        console.log 'Received message "' + data +
                    '" in queue "' + queueName1 + '"' if verbose
        expect(data).to.equal expectedItems1[itemCnt++]
        done() if itemCnt is expectedItems1.length

  it 'must be able to monitor two queues for input at the same time', (done) ->
    itemsQueued = 0
    for item in expectedItems1
      console.log 'Pushing message "' + item + '" to queue "' + queueName1 + '"' \
        if verbose
      qmgr.push queueName1, item
      ++itemsQueued

    for item in expectedItems2
      console.log 'Pushing message "' + item + '" to queue "' + queueName2 + '"' \
        if verbose
      qmgr.push queueName2, item
      ++itemsQueued
    
    itemCnt1 = itemCnt2 = 0
    consume = ->
      qmgr.popAny queueName1, queueName2, (queueName, data) ->
        console.log 'Received message "' + data +
                    '" in queue "' + queueName + '"' if verbose
        if queueName is queueName1
          expect(data).to.equal expectedItems1[itemCnt1++]
        if queueName is queueName2
          expect(data).to.equal expectedItems2[itemCnt2++]
        unless --itemsQueued
          done()
        else
          consume()
    consume()

  it 'quits cleanly', ->
    console.log 'Ending QueueMgr push/pop test' if verbose
    expect(qmgr.end()).to.equal true

