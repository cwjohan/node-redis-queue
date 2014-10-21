'use strict'
QueueMgr = require('..').QueueMgr
qmgr = null
queueName = 'test-queue'
expect = (require 'chai').expect
verbose = process.env.VERBOSE

expectedItems = [
    'item one',
    'item two',
    'item three',
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
        process.exit()
      done()

  it 'must clear test-queue', (done) ->
      qmgr.clear queueName, ->
        console.log 'Cleared "' + queueName + '"' if verbose
        done()

  it 'must retrieve pushed items in correct order', (done) ->
    qmgr.on 'end', ->
      console.log '>>>End QueueMgr connection'

    for item in expectedItems
      console.log 'Pushing message "' + item + '" to queue "' + queueName + '"' \
        if verbose
      qmgr.push queueName, item

    itemCnt = 0
    for item in expectedItems
      qmgr.pop queueName, (data) ->
        console.log 'Received message "' + data +
                    '" in queue "' + queueName + '"' if verbose
        console.log '>>>expecting "' + expectedItems[itemCnt] + '"' if verbose
        expect(data).to.equal expectedItems[itemCnt++]
        done() if itemCnt is expectedItems.length

  it 'quits cleanly', ->
    console.log 'Ending QueueMgr push/pop test' if verbose
    expect(qmgr.end()).to.equal true

