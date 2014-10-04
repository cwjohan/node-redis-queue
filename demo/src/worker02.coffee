'use strict'
SHA1 = require('../lib/helpers/tinySHA1.r4.js').SHA1
request = require 'request'
RedisQueue = require '../../../node-redis-queue'
urlQueueName = 'urlq'
urlQueueTimeout = 1
verbose = process.argv[3] is 'verbose'

if process.argv[2] is 'mem'
  memwatch = require 'memwatch'
  memwatch.on 'stats', (d) ->
    console.log '>>>current = ' + d.current_base + ', max = ' + d.max
  memwatch.on 'leak', (d) ->
    console.log '>>>LEAK = ', d

myQueue = new RedisQueue
myQueue.connect()

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

myQueue.monitor urlQueueTimeout, urlQueueName
console.log 'Waiting for data...'
