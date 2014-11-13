'use strict'
###
Channel Timeout Example -- worker01

This app waits for URLs to become available in the 'demo:urlq' queue, as provided
by worker01. Then, for each one it receives, the app gets the page for the URL,
computes an SHA1 value, and outputs it to the console log.
Once every second the onData function receives a timeout event (data undefined).
However, if it receives a '***stop***' message, it closes the connection and
quits immediately.

Usage:
  cd demo/lib
  export NODE_PATH='../../..'
  node worker01.js
 or
  node worker01.js 3
 where 3 is a timeout value (defaults to 1 second).

Use this app in conjunction with provider01.js. See the provider01 source code
for more details.
###
Channel = require('node-redis-queue').Channel
request = require 'request'
SHA1 = require('../lib/helpers/tinySHA1.r4.js').SHA1
urlQueueName = 'demo:urlq'
channel = null
timeout = process.argv[2] or 1
console.log 'timeout=' + timeout

channel = new Channel()
channel.connect ->
  initEventHandlers()
  channel.popTimeout urlQueueName, timeout, onData
  console.log 'Waiting for data...'

initEventHandlers = ->
  channel.on 'end', () ->
    console.log 'worker01 detected Redis connection ended'
    shutDown()

  channel.on 'error', (error) ->
    console.log 'worker01 stopping due to: ' + error
    shutDown()

  channel.on 'timeout', ->
    console.log '>>>timeout'

onData = (url) ->
  if typeof url is 'string'
    if url is '***stop***'
      console.log 'worker01 stopping'
      shutDown()
    console.log 'worker01 processing URL "' + url + '"'
    request url, (error, response, body) ->
      if not error and response.statusCode is 200
        sha1 = SHA1 body
        console.log url + ' SHA1 = ' + sha1
        channel.popTimeout urlQueueName, timeout, onData
      else
        console.log error
      return
  else
    console.log 'Unexpected message: ', url

shutDown = ->
  channel.end()
  process.exit()


