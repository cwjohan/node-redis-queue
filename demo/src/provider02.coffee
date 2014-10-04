'use strict'
RedisQueue = require '../../../node-redis-queue'
urlQueueName = 'urlq'
providerId = process.argv[2]
unless providerId
  console.log 'Missing provider id argument'
  process.exit()
resultQueueName = 'urlshaq' + providerId
resultQueueTimeout = 1
clearInitially = process.argv[3] is 'clear'
stopWorker = process.argv[2] is 'stop'
urls = [
  'http://www.google.com',
  'http://www.yahoo.com',
  'http://ourfamilystory.com',
  'http://ourfamilystory.com/pnuke'
]
resultCnt = 0

myQueue = new RedisQueue
myQueue.connect()

myQueue.on 'end', () ->
  console.log 'provider01 finished'
  process.exit()

myQueue.on 'error', (error) ->
  console.log 'provider01 stopping due to: ' + error
  process.exit()

myQueue.on 'message', (queueName, result) ->
  console.log 'result = ', result
  myQueue.disconnect() if ++resultCnt >= urls.length

queueURLs = () ->
  for url in urls
    console.log 'Pushing "' + url + '"'
    myQueue.push urlQueueName, {url: url, q: resultQueueName}
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
      return
  else
    queueURLs()

myQueue.monitor resultQueueTimeout, resultQueueName


