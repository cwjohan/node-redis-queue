'use strict'
###
WorkQueueBroker Example -- worker04

This app consumes work requests that become available in the 'urlq' queue,
as provided by provider04. For each one it receives, this app computes an
SHA1 value on the request URL (req.url) and outputs that and the request
URL value (req.url) to the result queue (req.q) specified in the work request.
provider04 consumes the data in the result queue.

However, if this app receives a '***stop***' message, it closes the connection
and quits immediately.

Usage:
   cd demo/lib
   export NODE_PATH='../../..'
   node worker04.js

Use this app in conjunction with provider04.js. See the provider04 source code
for more details.
###
WorkQueueBroker = require('node-redis-queue').WorkQueueBroker
request = require 'request'
SHA1 = require('../lib/helpers/tinySHA1.r4.js').SHA1
urlQueueName = 'urlq'
urlQueue = null

myBroker = new WorkQueueBroker()
myBroker.connect ->
  initEventHandlers()
  createUrlQueue()
  consumeUrlQueue()
  console.log 'waiting for work...'

initEventHandlers = ->
  myBroker.on 'end', () ->
    console.log 'worker04 detected Redis connection ended'
    shutDown()

  myBroker.on 'error', (error) ->
    console.log 'worker04 stopping due to: ' + error
    shutDown()

createUrlQueue = ->
  urlQueue = myBroker.createQueue urlQueueName

consumeUrlQueue = ->
  urlQueue.consume (req, ack) ->
    if typeof req is 'object'
      console.log 'worker04 processing request ', req
      request req.url, (error, response, body) ->
        if not error and response.statusCode is 200
          sha1 = SHA1 body
          console.log 'sending ' + req.url + ' SHA1 = ' + sha1
          myBroker.qmgr.push req.q, {url: req.url, sha1: sha1}
          ack()
        else
          console.log '>>>error: ', error
          myBroker.qmgr.push req.q, {url: req.url, err: error, code: response.statusCode}
          shutDown()
    else
      if typeof req is 'string' and req is '***stop***'
        console.log 'worker04 stopping'
        shutDown()
      console.log 'Unexpected message: ', req
      console.log 'Type of message = ' + typeof req
      ack()

shutDown = ->
  myBroker.end()
  process.exit()
