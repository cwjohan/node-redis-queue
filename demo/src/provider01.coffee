'use strict'
###
Channel Example -- provider01

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
Channel = require('node-redis-queue').Channel
urlQueueName = 'demo:urlq'
channel = null
clearInitially = process.argv[2] is 'clear'
stopWorker = process.argv[2] is 'stop'
urls = [
  'http://www.google.com',
  'http://www.yahoo.com',
  'http://www.google.com/robots.txt',
  'https://code.google.com'
]

channel = new Channel()
channel.connect ->
  console.log 'connected'
  initEventHandlers()
  main()

initEventHandlers = ->
  channel.on 'end', () ->
    console.log 'provider01 finished'
    process.exit()
  .on 'error', (error) ->
    console.log 'provider01 stopping due to: ' + error
    process.exit()

main = ->
  if clearInitially
    channel.clear urlQueueName, () ->
      console.log 'Cleared "' + urlQueueName + '"'
      enqueueURLs()
      channel.disconnect()
  else
    unless stopWorker
      enqueueURLs()
    else
      console.log 'Stopping worker'
      channel.push urlQueueName, '***stop***'
    channel.disconnect()

enqueueURLs = ->
  for url in urls
    console.log 'Pushing "' + url + '" to queue "' + urlQueueName + '"'
    channel.push urlQueueName, url
  return
