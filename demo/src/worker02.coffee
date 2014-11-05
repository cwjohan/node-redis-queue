'use strict'
###
Channel Example -- woker02

This app waits for work requests to become available in the 'urlq' queue.
Then, for each one it receives, the app get the page for the URL, computes an
SHA1 value on the request URL (req.url) and outputs that and the request URL
value (req.url) to the result queue (req.q) specified in the work request.
However, if it receives a '***stop***' message, it closes the connection
and quits immediately.

Usage:
  cd demo/lib
  export NODE_PATH='../../..'
  node worker02.js

Use this app in conjunction with provider02.js. See the provider02 source code
for more details.
###
Channel = require('node-redis-queue').Channel
request = require 'request'
SHA1 = require('../lib/helpers/tinySHA1.r4.js').SHA1
urlQueueName = 'urlq'

channel = new Channel()
channel.connect ->
  initEventHandlers()
  channel.pop urlQueueName, onData
  console.log 'waiting for work...'

initEventHandlers = ->
  channel.on 'end', () ->
    console.log 'worker01 detected Redis connection ended'
    shutDown()

  channel.on 'error', (error) ->
    console.log 'worker01 stopping due to: ' + error
    shutDown()

onData = (req) ->
  if typeof req is 'object'
    console.log 'worker01 processing request ', req
    request req.url, (error, response, body) ->
      if not error and response.statusCode is 200
        sha1 = SHA1 body
        console.log req.url + ' SHA1 = ' + sha1
        channel.push req.q, {url: req.url, sha1: sha1}
      else
        console.log error
        channel.push req.q, {url: req.url, err: error, code: response.statusCode}
      channel.pop urlQueueName, onData
  else
    if typeof req is 'string' and req is '***stop***'
      console.log 'worker02 stopping'
      shutDown()
    console.log 'Unexpected message: ', req
    console.log 'Type of message = ' + typeof req
    shutDown()

shutDown = ->
  channel.end()
  process.exit()

