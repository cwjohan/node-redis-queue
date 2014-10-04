'use strict'
RedisQueue = require '../../../node-redis-queue'
urlQueueName = 'urlq'
myQueue = null
clearInitially = process.argv[2] is 'clear'
stopWorker = process.argv[2] is 'stop'
urls = [
  'http://www.google.com',
  'http://www.yahoo.com',
  'http://ourfamilystory.com',
  'http://ourfamilystory.com/pnuke'
]

myQueue = new RedisQueue
myQueue.connect()

myQueue.on 'end', () ->
  console.log 'provider01 finished'
  process.exit()

myQueue.on 'error', (error) ->
  console.log 'provider01 stopping due to: ' + error
  process.exit()

queueURLs = () ->
  for url in urls
    console.log 'Pushing "' + url + '"'
    myQueue.push urlQueueName, url
  return

if stopWorker
  console.log 'Stopping worker'
  myQueue.push urlQueueName, '***stop***'
  myQueue.disconnect()
else
  if clearInitially
    myQueue.clear urlQueueName, () ->
      console.log 'Cleared "' + urlQueueName + '"'
      queueURLs()
      myQueue.disconnect()
      return
  else
    queueURLs()
    myQueue.disconnect()


