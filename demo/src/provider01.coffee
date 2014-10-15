'use strict'
###
QueueMgr Example -- provider01

For each URL in the urls list, this app pushes it into the 'urlq' queue
for consumption by worker01. When done with that, it quits.

Usage:
  cd demo/lib
  export NODE_PATH='../../..'
  node provider01.js clear
  node provider01.js
  ...
  node provider01.js stop

Use this app in conjunction with worker01.js. See the worker01 source code
for more details.
###
QueueMgr = require('node-redis-queue').QueueMgr
urlQueueName = 'urlq'
qmgr = null
clearInitially = process.argv[2] is 'clear'
stopWorker = process.argv[2] is 'stop'
urls = [
  'http://www.google.com',
  'http://www.yahoo.com',
  'http://ourfamilystory.com',
  'http://ourfamilystory.com/pnuke'
]

qmgr = new QueueMgr
qmgr.connect ->
  console.log 'connected'
  initEventHandlers()
  main()

initEventHandlers = ->
  qmgr.on 'end', () ->
    console.log 'provider01 finished'
    process.exit()
  .on 'error', (error) ->
    console.log 'provider01 stopping due to: ' + error
    process.exit()

main = ->
  if clearInitially
    qmgr.clear urlQueueName, () ->
      console.log 'Cleared "' + urlQueueName + '"'
      enqueueURLs()
      qmgr.disconnect()
  else
    unless stopWorker
      enqueueURLs()
    else
      console.log 'Stopping worker'
      qmgr.push urlQueueName, '***stop***'
    qmgr.disconnect()

enqueueURLs = ->
  for url in urls
    console.log 'Pushing "' + url + '" to queue "' + urlQueueName + '"'
    qmgr.push urlQueueName, url
  return
