'use strict';

var config, configurator, firstTime, mainLoop, next, redisClient;

configurator = require('../../lib/redisQueueConfig');

config = configurator.getConfig();

redisClient = configurator.getClient(config);

redisClient.on('end', function() {
  console.log('Connection closed');
  return process.exit();
});

redisClient.on('error', function(err) {
  console.log('Redis error: ' + err);
  return process.exit();
});

next = 0;

firstTime = true;

mainLoop = function() {
  console.log('here we go... ' + next);
  return redisClient.scan(next, function(err, result) {
    var keys;
    if (err) {
      console.log('Scan err = ', err);
      process.exit();
    }
    next = parseInt(result[0]);
    keys = result[1];
    console.log('next = ', next);
    console.log('keys = ', keys);
    if (next === 0) {
      console.log('done');
      return redisClient.quit();
    } else {
      return mainLoop();
    }
  });
};

mainLoop();
