'use strict'
# This app waits for work requests to become available in the 'urlq' queue.
# Then, for each one it receives, the app get the page for the URL, computes an
# SHA1 value on the request URL (req.url) and outputs that and the request URL
# value (req.url) to the result queue (req.q) specified in the work request.
# However, if it receives a '***stop***' message, it closes the connection
# and quits immediately.
#
## Usage:
#   cd demo/lib
#   export NODE_PATH='../../..'
#   node worker02.js
#   or
#   node worker02.js mem verbose
#
#   Use this app in conjunction with provider02.js. See the provider02 source code
#   for more details.
QueueMgr = require('node-redis-queue').QueueMgr
request = require 'request'
SHA1 = require('../lib/helpers/tinySHA1.r4.js').SHA1
urlQueueName = 'urlq'
monitorTimeout = 1
verbose = process.argv[3] is 'verbose'

qmgr = new QueueMgr
qmgr.connect ->
  checkArgs()
  initEventHandlers()
  qmgr.pop urlQueueName, onData
  console.log 'waiting for work...'

checkArgs = ->
  if process.argv[2] is 'mem'
    memwatch = require 'memwatch'
    memwatch.on 'stats', (d) ->
      console.log '>>>current = ' + d.current_base + ', max = ' + d.max
    memwatch.on 'leak', (d) ->
      console.log '>>>LEAK = ', d

initEventHandlers = ->
  qmgr.on 'end', () ->
    console.log 'worker01 detected Redis connection ended'
    shutDown()

  qmgr.on 'error', (error) ->
    console.log 'worker01 stopping due to: ' + error
    shutDown()

onData = (req) ->
  if typeof req is 'object'
    console.log 'worker01 processing request ', req
    request req.url, (error, response, body) ->
      if not error and response.statusCode is 200
        sha1 = SHA1 body
        console.log req.url + ' SHA1 = ' + sha1
        qmgr.push req.q, {url: req.url, sha1: sha1}
      else
        console.log error
        qmgr.push req.q, {url: req.url, err: error, code: response.statusCode}
      qmgr.pop urlQueueName, onData
  else
    if typeof req is 'string' and req is '***stop***'
      console.log 'worker02 stopping'
      shutDown()
    console.log 'Unexpected message: ', req
    console.log 'Type of message = ' + typeof req
    shutDown()

shutDown = ->
  qmgr.end()
  process.exit()

