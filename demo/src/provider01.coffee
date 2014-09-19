'use strict'
redis = require 'redis'
RedisQueue = require '../../../node-redis-queue'
redisPort = 6379
redisHost = '127.0.0.1'
redisQueueName = 'urlq'
redisQueueTimeout = 1
redisClient = null
myQueue = null
clearInitially = process.argv[2] is 'clear'
stopWorker = process.argv[2] is 'stop'
urls = [
  'http://www.google.com',
  'http://www.yahoo.com'
]

redisClient = redis.createClient redisPort, redisHost
myQueue = new RedisQueue redisClient, redisQueueTimeout

myQueue.on 'end', () ->
  console.log 'provider01 finished'
  process.exit()

myQueue.on 'error', (error) ->
  console.log 'provider01 stopping due to: ' + error
  process.exit()

queueURLs = () ->
  for url in urls
    console.log 'Pushing "' + url
    myQueue.push redisQueueName, url
  return

if stopWorker
  console.log 'Stopping worker'
  myQueue.push redisQueueName, '***stop***'
else
  if clearInitially
    myQueue.clear redisQueueName, () ->
      console.log 'Cleared "' + redisQueueName + '"'
      queueURLs()
  else
    queueURLs()

redisClient.quit()

