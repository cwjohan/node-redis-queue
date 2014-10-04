'use strict'
SHA1 = require('../lib/helpers/tinySHA1.r4.js').SHA1
request = require 'request'
urlQueueName = 'urlq'
redisQueueTimeout = 1
myQueue = null
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

myQueue.on 'message', (queueName, url) ->
  if typeof url is 'string'
    if url is '***stop***'
      console.log 'worker01 stopping'
      process.exit()
    console.log 'worker01 processing URL "' + url + '"'
    request url, (error, response, body) ->
      if not error and response.statusCode is 200
        sha1 = SHA1 body
        console.log url + ' SHA1 = ' + sha1
      else
        console.log error
  else
    console.log 'Unexpected message: ', url

myQueue.monitor redisQueueTimeout, urlQueueName
console.log 'Waiting for data...'
