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
resultsExpected = 0

myQueue = new RedisQueue
myQueue.connect ->
  console.log 'connected'
  initEventHandlers()
  main()

initEventHandlers = ->
  myQueue.on 'end', ->
    console.log 'provider01 finished'
    process.exit()

  myQueue.on 'error', (error) ->
    console.log 'provider01 stopping due to: ' + error
    process.exit()

  myQueue.on 'message', (queueName, result) ->
    console.log 'result = ', result
    myQueue.disconnect() unless --resultsExpected

main = ->
  if clearInitially
    myQueue.clear urlQueueName, ->
      console.log 'Cleared "' + urlQueueName + '"'
      myQueue.clear resultQueueName, ->
        console.log 'Cleared "' + resultQueueName + '"'
        myQueue.disconnect()
  else
    unless stopWorker
      enqueueURLs()
    else
      console.log 'Stopping worker'
      myQueue.push urlQueueName, '***stop***'
      myQueue.disconnect()

enqueueURLs = ->
  for url in urls
    console.log 'Pushing "' + url + '"'
    myQueue.push urlQueueName, {url: url, q: resultQueueName}
    ++resultsExpected
  myQueue.monitor resultQueueTimeout, resultQueueName
  console.log 'waiting for responses from worker...'

