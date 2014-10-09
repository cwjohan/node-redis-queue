'use strict'
# This app waits for work requests to become available in the 'urlq' queue.
# Then, for each one it receives, the app computes an SHA1 value on the request
# URL (req.url) and outputs that and the request URL value (req.url) to the
# result queue (req.q) specified in the work request. However, if it receives
# a '***stop***' message, it closes the connection and quits immediately.
#
## Usage:
#   cd demo/lib
#   node worker02.js
#   or
#   node worker02.js mem verbose
#
#   Use this app in conjunction with provider02.js. See the provider02 source code
#   for more details.
RedisQueue = require '../../../node-redis-queue'
request = require 'request'
SHA1 = require('../lib/helpers/tinySHA1.r4.js').SHA1
urlQueueName = 'urlq'
monitorTimeout = 1
verbose = process.argv[3] is 'verbose'

myQueue = new RedisQueue
myQueue.connect ->
  checkArgs()
  initEventHandlers()
  myQueue.monitor monitorTimeout, urlQueueName
  console.log 'waiting for work...'

checkArgs = ->
  if process.argv[2] is 'mem'
    memwatch = require 'memwatch'
    memwatch.on 'stats', (d) ->
      console.log '>>>current = ' + d.current_base + ', max = ' + d.max
    memwatch.on 'leak', (d) ->
      console.log '>>>LEAK = ', d

initEventHandlers = ->
  myQueue.on 'end', () ->
    console.log 'worker01 detected Redis connection ended'
    process.exit()

  myQueue.on 'error', (error) ->
    console.log 'worker01 stopping due to: ' + error
    process.exit()

  myQueue.on 'timeout', ->
    console.log 'worker01 timeout' if verbose

  myQueue.on 'message', (queueName, req) ->
    if typeof req is 'object'
      console.log 'worker01 processing request ', req
      request req.url, (error, response, body) ->
        if not error and response.statusCode is 200
          sha1 = SHA1 body
          console.log req.url + ' SHA1 = ' + sha1
          myQueue.push req.q, {url: req.url, sha1: sha1}
        else
          console.log error
          myQueue.push req.q, {url: req.url, err: error}
    else
      if typeof req is 'string' and req is '***stop***'
        console.log 'worker01 stopping'
        process.exit()
      console.log 'Unexpected message: ', req
      console.log 'Type of message = ' + typeof req

