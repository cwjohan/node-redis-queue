'use strict'
# This app waits for URLs to become available in the 'urlq' queue. Then, for each
# one it receives, the app computes an SHA1 value and outputs it to the console log.
# However, if it receives a '***stop***' message, it closes the connection and
# quits immediately.
#
# Usage:
#   cd demo/lib
#   node worker01.js
#   or
#   node worker01.js mem verbose
#
#   Use this app in conjunction with provider01.js. See the provider01 source code
#   for more details.
RedisQueue = require '../../../node-redis-queue'
request = require 'request'
SHA1 = require('../lib/helpers/tinySHA1.r4.js').SHA1
urlQueueName = 'urlq'
myQueue = null
verbose = process.argv[3] is 'verbose'

myQueue = new RedisQueue
myQueue.connect ->
  checkArgs()
  initEventHandlers()
  myQueue.pop urlQueueName
  console.log 'Waiting for data...'

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
    done()

  myQueue.on 'error', (error) ->
    console.log 'worker01 stopping due to: ' + error
    done()

  myQueue.on 'timeout', ->
    console.log 'worker01 timeout' if verbose

  myQueue.on 'message', (queueName, url) ->
    console.log 'message url = ' + url
    if typeof url is 'string'
      if url is '***stop***'
        console.log 'worker01 stopping'
        done()
      console.log 'worker01 processing URL "' + url + '"'
      request url, (error, response, body) ->
        if not error and response.statusCode is 200
          sha1 = SHA1 body
          console.log url + ' SHA1 = ' + sha1
          myQueue.pop urlQueueName
        else
          console.log error
        return
    else
      console.log 'Unexpected message: ', url

done = ->
  myQueue.end()
  process.exit()


