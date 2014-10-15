## Dump the contents of the Redis database
## For this to work, you need to add 'scan' to the commands.js file of
## your redis module in node_modules/redis/lib.
'use strict'

configurator = require '../../lib/redisQueueConfig'
config = configurator.getConfig()
redisClient = configurator.getClient(config)

redisClient.on 'end', ->
  console.log 'Connection closed'
  process.exit()

redisClient.on 'error', (err) ->
  console.log 'Redis error: ' + err
  process.exit()

next = 0
firstTime = true

mainLoop = ->
  console.log 'here we go... ' + next
  redisClient.scan next, (err, result) ->
    if err
      console.log 'Scan err = ', err
      process.exit()

    next = parseInt(result[0])
    keys = result[1]
    console.log 'next = ', next
    console.log 'keys = ', keys
    if next is 0
      console.log 'done'
      redisClient.quit()
    else
      mainLoop()

mainLoop()

