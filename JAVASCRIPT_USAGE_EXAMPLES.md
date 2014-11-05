###Channel Javascript Usage Example

1. Ensure you have a Redis server installed and running. For example, once installed, you can run it locally by

        redis-server &

1. Require `node-redis-queue` Channel

        var Channel = require('node-redis-queue').Channel;


1. Create a Channel instance and connect to Redis

        var channel = new Channel();  
        channel.connect(function() {
          console.log('ready');
          myMainLogic();
        });

1. Optionally, handle error events

        channel.on('error', function(error) {  
            console.log('Stopping due to: ' + error);  
            process.exit();
        });

1. Optionally, handle lost connection events

        channel.on('end', function() {
          console.log('Connection lost');
        });

1. Optionally, clear previous data from the queue, providing a callback.

        channel.clear(function() {
          console.log('cleared');
          doImportantStuff();
        });

1. Optionally, push data to your queue

        channel.push(queueName, myData);

1. Optionally, pop data off your queue, providing a callback to
   handle the data

        channel.pop(queueName, function(myData) {  
            console.log('data = ' + myData); 
        });

   or, alternatively, pop off any of multiple queues

        channel.popAny(queueName1, queueName2, function(myData) {
            console.log('data = ' + myData);
        });

   Once popping data from a queue, avoid pushing data to the same queue from the same connection, since
   a hang could result. This appears to be a Redis limitation when using blocking reads.

1. When done, quit the Channel instance

        channel.disconnect();

  or, alternatively, if monitoring, end the connection

        channel.end();

  or, if there may be a number of redis commands queued,

        channel.shutdownSoon();

###WorkQueueMgr Javascript Usage Example

1. Ensure you have a Redis server installed and running. For example, once installed, you can run it locally by

        redis-server &

1. Require `node-redis-queue` WorkQueueMgr

        var WorkQueueMgr = require('node-redis-queue').WorkQueueMgr;

1. Create a WorkQueueMgr instance and connect to Redis

        var mgr = new WorkQueueMgr();  
        mgr.connect(function () {
          console.log('ready');
          myMainLogic();
        });

  Alternatively, you can provide an existing Redis connection (i.e., a redis client instance)

        mgr.attach(redisConn);

1. Optionally, handle error events

        mgr.on('error', function(error) {   
            console.log('Stopping due to: ' + error);  
            process.exit();
        });

1. Optionally, handle lost connection events

        mgr.on('end', function {   
          console.log('Connection lost');
        });

1. Create a work queue instance

        var queue = mgr.createQueue(queueName);

1. Optionally, clear previous data from the queue, providing a callback
   to handle the data.

        queue.clear(queueName, function() {
          console.log('cleared');
          doImportantStuff();
        });

1. Optionally, send data to your queue

        queue.send(myData);

1. Optionally, consume data from your queue and call ack when ready to consume another data item

        queue.consume(function(myData, ack) {  
            console.log('data = ' + myData);   
            ...
            ack();
        });

   or, alternatively,

        queue.consume(function(myData, ack) {
            console.log('data = ' + myData);
            ...
            ack();
        }, arity);

   where arity is an integer indicating the number of async callbacks to schedule in parallel. See demo 04 for example usage.

   If multiple queues are being consumed, they are consumed with highest priority given to the queues consumed first (i.e., in the order in which the consume statements are executed).

   Note that ack(true) may be used to indicate that no further data is expected from the given work queue.
   This is useful, for example, in testing, when a clean exit from a test case is desired.

   Once consuming from a queue, avoid sending data to the same queue from the same connection (i.e., the same mgr instance),
   since a hang could result. This appears to be a Redis limitation when using blocking reads. You can test
   `mgr.channel.outstanding` for zero to determine if it is OK to send on the same connection.

1. Optionally, destroy a work queue if it no longer is needed. Assign null to the queue variable to free up memory.

        queue.destroy();
        queue = null;

1. When done, quit the WorkQueueMgr instance

        mgr.disconnect();

  or, alternatively, if consuming data from the queue, end the connection

        mgr.end();

  or, if there may be a number of redis commands queued,

        mgr.shutdownSoon();

