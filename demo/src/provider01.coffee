'use strict'
# For each URL in the urls list, this app puts it into the 'urlq' queue.
#
# Usage:
#   cd demo/lib
#   node provider01.js clear
#   node provider01.js
#   ...
#   node provider01.js stop
#
#   Use this app in conjunction with worker01.js. See the worker01 source code
#   for more details.
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
myQueue.connect ->
  console.log 'connected'
  initEventHandlers()
  main()

initEventHandlers = ->
  myQueue.on 'end', () ->
    console.log 'provider01 finished'
    process.exit()

  myQueue.on 'error', (error) ->
    console.log 'provider01 stopping due to: ' + error
    process.exit()

main = ->
  if clearInitially
    myQueue.clear urlQueueName, () ->
      console.log 'Cleared "' + urlQueueName + '"'
      enqueueURLs()
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
    console.log 'Pushing "' + url + '" to queue "' + urlQueueName + '"'
    myQueue.push urlQueueName, url
  return

