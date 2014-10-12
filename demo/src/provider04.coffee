'use strict'
# For each URL in the urls list, this app puts a work request in 'urlq' queue
# and waits for the results to be returned in 'urlshaq01' or whatever,
# depending on the providerId parameter.
#
# Usage:
#     cd demo/lib
#     node provider02.js <providerId> [clear]
#   or
#     node provider02.js stop
#
#   where <providerId> is something to make this provider instance unique,
#   such as "01", "02", "foo", "bar", or whatever.
#
#   Use this app in conjunction with worker02.js. See the worker02 source code
#   for more details.
WorkQueueBroker = require '../../lib/workQueueBroker'
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
    subscribeToUrlQueue()
    publishURLs()

initEventHandlers = ->
  myBroker.on 'end', () ->
    console.log 'provider01 finished'
    process.exit()

  myBroker.on 'error', (error) ->
    console.log 'provider01 stopping due to: ' + error
    process.exit()

createWorkQueues = ->
  urlQueue = myBroker.createQueue urlQueueName
  resultQueue = myBroker.createQueue resultQueueName

subscribeToUrlQueue = ->
  resultQueue.subscribe (result, ack) ->
    console.log 'result = ', result
    ack()
    myBroker.end() unless --resultsExpected

clearQueues = ->
  urlQueue.clear ->
    console.log 'cleared "' + urlQueueName + '"'
    resultQueue.clear ->
      console.log 'cleared "' + resultQueueName + '"'
      myBroker.disconnect()

publishURLs = ->
  unless stopWorker
    for url in urls
      console.log 'Publishing "' + url + '"'
      urlQueue.publish {url: url, q: resultQueueName}
      ++resultsExpected
    console.log 'waiting for results from worker...'

stopOneWorker = ->
  console.log 'Stopping worker'
  urlQueue.publish '***stop***'
  myBroker.disconnect()

