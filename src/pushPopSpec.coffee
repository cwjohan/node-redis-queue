'use strict'
RedisQueue = require './'
myQueue = null
queueName = 'test-queue'
expectedItems = [
    'item one',
    'item two',
    'item three',
]
itemCnt = 0

describe 'RedisQueue push/pop', () ->
  it 'must connect to redis-server', (done) ->
    myQueue = new RedisQueue
    myQueue.connect () ->
      console.log 'redis queue ready'
      expect(typeof myQueue).toEqual 'object'

      myQueue.on 'error', (error) ->
        console.log '>>>' + error
        process.exit()

      myQueue.clear queueName, () ->
        console.log 'Cleared "test-queue"'
        done()

  it 'must retrieve pushed items in correct order', (done) ->
    myQueue.on 'message', (queueName, payload) ->
      console.log 'Received message "' + payload +
                  '" in queue "' + queueName + '"'
      expect(queueName).toEqual queueName
      expect(payload).toEqual expectedItems[itemCnt++]
      myQueue.pop queueName
      if itemCnt >= expectedItems.length
        done()
        
    myQueue.on 'timeout', () ->
      console.log '>>>Timeout...'

    myQueue.on 'end', () ->
      console.log '>>>End redis connection'

    for item in expectedItems
      console.log 'Pushing message "' + item + '" to queue "test-queue"'
      myQueue.push queueName, item

    myQueue.pop queueName

  it 'quits Redis cleanly', () ->
    console.log 'Ending redis queue'
    expect(myQueue.end()).toEqual true

