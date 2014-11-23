'use strict'
###
Channel Example -- provider02

For each URL in the urls list, this app puts a work request in 'demo:urlq' queue
consumed by worker02 and waits for the results to be returned in 'demo:urlshaq01'
or whatever, depending on the providerId parameter.

Usage:
   cd demo/lib
   export NODE_PATH='../../..'
   node provider02.js <providerId> [clear]
 or
   node provider02.js stop

 where <providerId> is something to make this provider instance unique,
 such as "01", "02", "foo", "bar", or whatever.

Example usage:
  cd demo/lib
  export NODE_PATH='../../..'
  node provider02.js 01 clear
  node provider02.js
  node provider02.js
  node provider02.js stop

Use this app in conjunction with worker02.js. See the worker02 source code
for more details.
###
Channel = require('node-redis-queue').Channel
urlQueueName = 'demo:urlq'
providerId = process.argv[2]
unless providerId
  console.log 'Missing provider id argument'
  process.exit()
resultQueueName = 'demo:urlshaq' + providerId
clearInitially = process.argv[3] is 'clear'
stopWorker = process.argv[2] is 'stop'
urls = [
  'http://www.google.com',
  'http://www.yahoo.com',
  'http://www.google.com/robots.txt',
  'https://code.google.com'
]
resultsExpected = 0

channel = new Channel()
channel.connect ->
  console.log 'connected'
  initEventHandlers()
  main()

initEventHandlers = ->
  channel.on 'end', ->
    console.log 'provider01 finished'
    shutDown()

  channel.on 'error', (error) ->
    console.log 'provider01 stopping due to: ' + error
    shutDown()

main = ->
  if clearInitially
    channel.clear urlQueueName, ->
      console.log 'Cleared "' + urlQueueName + '"'
      channel.clear resultQueueName, ->
        console.log 'Cleared "' + resultQueueName + '"'
        shutDown()
  else
    unless stopWorker
      enqueueURLs()
    else
      console.log 'Stopping worker'
      channel.push urlQueueName, '***stop***'
      shutDown()

enqueueURLs = ->
  for url in urls
    console.log 'Pushing "' + url + '"'
    channel.push urlQueueName, {url: url, q: resultQueueName}
    ++resultsExpected
  channel.pop resultQueueName, onData
  console.log 'waiting for responses from worker...'

onData = (result) ->
  console.log 'result = ', result
  if --resultsExpected
    channel.pop resultQueueName, onData
  else
    shutDown()

shutDown = ->
  channel.end()
  process.exit()
