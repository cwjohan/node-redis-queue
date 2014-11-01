'use strict'
###
QueueMgr Example -- worker01

This app waits for URLs to become available in the 'urlq' queue, as provided
by worker01. Then, for each one it receives, the app gets the page for the URL,
computes an SHA1 value, and outputs it to the console log.
However, if it receives a '***stop***' message, it closes the connection and
quits immediately.

Usage:
  cd demo/lib
  export NODE_PATH='../../..'
  node worker01.js

Use this app in conjunction with provider01.js. See the provider01 source code
for more details.
###
QueueMgr = require('node-redis-queue').QueueMgr
request = require 'request'
SHA1 = require('../lib/helpers/tinySHA1.r4.js').SHA1
urlQueueName = 'urlq'
qmgr = null

qmgr = new QueueMgr()
qmgr.connect ->
  initEventHandlers()
  qmgr.pop urlQueueName, onData
  console.log 'Waiting for data...'

initEventHandlers = ->
  qmgr.on 'end', () ->
    console.log 'worker01 detected Redis connection ended'
    shutDown()

  qmgr.on 'error', (error) ->
    console.log 'worker01 stopping due to: ' + error
    shutDown()

onData = (url) ->
  console.log 'message url = ' + url
  if typeof url is 'string'
    if url is '***stop***'
      console.log 'worker01 stopping'
      shutDown()
    console.log 'worker01 processing URL "' + url + '"'
    request url, (error, response, body) ->
      if not error and response.statusCode is 200
        sha1 = SHA1 body
        console.log url + ' SHA1 = ' + sha1
        qmgr.pop urlQueueName, onData
      else
        console.log error
      return
  else
    console.log 'Unexpected message: ', url

shutDown = ->
  qmgr.end()
  process.exit()


