'use strict'
###
WorkQueueBroker Example -- provider04

For each URL in the urls list, this app puts a work request in 'urlq' queue to be
consumed by worker04. It then waits for the results to be returned in 'urlshaq01'
or whatever result queue, depending on the providerId parameter.

Usage:
    cd demo/lib
    export NODE_PATH='../../..'
    node provider04.js <providerId> [clear]
  or
    node provider04.js stop

  where <providerId> is something to make this provider instance unique,
  such as "01", "02", "foo", "bar", or whatever.

Example usage:
  cd demo/lib
  export NODE_PATH='../../..'
  node provider04.js 01 clear
  node provider04.js
  node provider04.js
  node provider04.js stop

Use this app in conjunction with worker02.js. See the worker02 source code
for more details.
###
WorkQueueBroker = require('node-redis-queue').WorkQueueBroker
urlQueueName = 'urlq'
urlQueue = null
resultQueue = null
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
resultsExpected = 0

myBroker = new WorkQueueBroker()
myBroker.connect ->
  console.log 'connected'
  initEventHandlers()
  createWorkQueues()
  if stopWorker
    stopOneWorker()
  else if clearInitially
    clearQueues()
  else
    sendURLs()
    consumeResultQueue()

initEventHandlers = ->
  myBroker.on 'end', () ->
    console.log 'provider04 finished'
    process.exit()

  myBroker.on 'error', (error) ->
    console.log 'provider01 stopping due to: ' + error
    process.exit()

createWorkQueues = ->
  urlQueue = myBroker.createQueue urlQueueName
  resultQueue = myBroker.createQueue resultQueueName

clearQueues = ->
  urlQueue.clear ->
    console.log 'cleared "' + urlQueueName + '"'
    resultQueue.clear ->
      console.log 'cleared "' + resultQueueName + '"'
      myBroker.disconnect()

sendURLs = ->
  unless stopWorker
    for url in urls
      console.log 'Publishing "' + url + '"'
      urlQueue.send {url: url, q: resultQueueName}
      ++resultsExpected
    console.log 'waiting for results from worker...'

consumeResultQueue = ->
  resultQueue.consume (result, ack) ->
    console.log 'result = ', result
    ack()
    myBroker.end() unless --resultsExpected

stopOneWorker = ->
  console.log 'Stopping worker'
  urlQueue.send '***stop***'
  myBroker.disconnect()

