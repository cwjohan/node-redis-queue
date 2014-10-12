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
WorkQueueBroker = require '../../lib/workQueueBroker'
request = require 'request'
SHA1 = require('../lib/helpers/tinySHA1.r4.js').SHA1
urlQueueName = 'urlq'
urlQueue = null
verbose = process.argv[3] is 'verbose'

myBroker = new WorkQueueBroker()
myBroker.connect ->
  checkArgs()
  initEventHandlers()
  createUrlQueue()
  subscribeToUrlQueue()
  console.log 'waiting for work...'

checkArgs = ->
  if process.argv[2] is 'mem'
    memwatch = require 'memwatch'
    memwatch.on 'stats', (d) ->
      console.log '>>>current = ' + d.current_base + ', max = ' + d.max
    memwatch.on 'leak', (d) ->
      console.log '>>>LEAK = ', d

initEventHandlers = ->
  myBroker.on 'end', () ->
    console.log 'worker01 detected Redis connection ended'
    process.exit()

  myBroker.on 'error', (error) ->
    console.log 'worker01 stopping due to: ' + error
    process.exit()

createUrlQueue = ->
  urlQueue = myBroker.createQueue urlQueueName

subscribeToUrlQueue = ->
  urlQueue.subscribe (req, ack) ->
    if typeof req is 'object'
      console.log 'worker01 processing request ', req
      request req.url, (error, response, body) ->
        if not error and response.statusCode is 200
          sha1 = SHA1 body
          console.log 'publishing ' + req.url + ' SHA1 = ' + sha1
          myBroker.qmgr.push req.q, {url: req.url, sha1: sha1}
          ack()
        else
          console.log '>>>error: ', error
          myBroker.qmgr.push req.q, {url: req.url, err: error, code: response.statusCode}
          process.exit()
    else
      if typeof req is 'string' and req is '***stop***'
        console.log 'worker04 stopping'
        process.exit()
      console.log 'Unexpected message: ', req
      console.log 'Type of message = ' + typeof req
      ack()
