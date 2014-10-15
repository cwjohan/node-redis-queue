'use strict'
QueueMgr = require('..').QueueMgr
qmgr = null
queueName = 'test-queue'

expectedItems = [
    'item one',
    'item two',
    'item three',
]

describe 'QueueMgr push/pop', ->
  it 'must connect to redis-server', (done) ->
    qmgr = new QueueMgr
    qmgr.connect ->
      console.log 'push/pop queue mgr ready'
      expect(typeof qmgr).toEqual 'object'
      expect(typeof qmgr.push).toEqual 'function'

      qmgr.on 'error', (error) ->
        console.log '>>>' + error
        process.exit()

      qmgr.clear queueName, ->
        console.log 'Cleared "' + queueName + '"'
        done()

  it 'must retrieve pushed items in correct order', (done) ->
    qmgr.on 'end', ->
      console.log '>>>End QueueMgr connection'

    for item in expectedItems
      console.log 'Pushing message "' + item + '" to queue "' + queueName + '"'
      qmgr.push queueName, item

    itemCnt = 0
    for item in expectedItems
      qmgr.pop queueName, (data) ->
        console.log 'Received message "' + data +
                    '" in queue "' + queueName + '"'
        console.log '>>>expecting "' + expectedItems[itemCnt] + '"'
        expect(data).toEqual expectedItems[itemCnt++]
        done() if itemCnt is expectedItems.length

  it 'quits cleanly', ->
    console.log 'Ending QueueMgr push/pop test'
    expect(qmgr.end()).toEqual true

