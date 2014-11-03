node-redis-queue
=======

This is a very simple queing wrapper for Redis that is intended for communication between separate processes. It comes with two APIs:

1. QueueMgr -- the push/pop interface

   The process creates a single instance of QueueMgr.
   The sending process uses the QueueMgr instance to push data onto the queue via the `push` function. The receiving process uses
   the QueueMgr instance to remove data from the same queue via the `pop` function, which delivers the data to a callback function
   which accepts a single data parameter.

2. WorkQueueBroker -- the send/consume interface

   The process creates a single instance of WorkQueueBroker.
   Then, it uses that instance to create one or more instances of WorkQueue, each representing a different queue having a unique name.
   The sending process uses a WorkQueue instance to send data to the corresponding queue via the `send` function. The receiving process uses
   a WorkQueue instance to remove data from the corresponding queue via the `consume` function, which delivers the data to a callback function
   which accepts a data parameter and an ack parameter. The latter is a function that is called to indicate that the callback function
   is complete and is ready to accept some additional data, if any, in the queue. See the usage examples below and also
   the worker03 and worker04 files in the demo src or lib directories for examples of how to do this.

`consume` is different from `pop` in that a single call to `consume` can fetch
multiple data items from the given queue, while `pop` must be called repeatedly to fetch items from the queue.

An additional function present in both interfaces is `clear`, which clears the given queue and then calls the provided callback.

##Events Emitted by Both Interfaces

`'error'` -- emitted when an error is reported by Redis

`'end'` -- emitted when a connection to the Redis server has been lost

`'drain'` -- emitted when the TCP connection to the Redis server has been buffering, but is now writable. 
This event can be used to stream commands in to Redis and adapt to backpressure: Call commandQueueLength 
to detect when the length is too much, then use the `'drain'` event to resume sending data to the queue or queues.

##Installation

    npm install node-redis-queue --save

##Configuration

Sample configuration files may be found in the sample-configs directory. In each config file,
the redis_provider type setting specifies the strategy to use. The verbose setting, if true, specifies to
display the config file settings on startup.

The environment variable QUEUE_CONFIG_FILE specifies which config file is to be used.
If not set, it defaults to node-redis-queue/redis-queue-config.json, which specifies to use
the local Redis server with no password. If you do nothing, that is what you get.

Currently implemented strategies are:

* **connStrategyDefaultLocal** -- local Redis server, no password

* **connStrategyCustom** -- configurable host, port, and password; defaults to local Redis server, no password

* **connStrategyHerokuRedisCloud** -- host, port, and password specified by REDISCLOUD_URL environment variable; if not
   set, then defaults to local Redis server, no password

* **connStrategyBlueMixRedisCloud** -- host, port, and password specified by VCAP_SERVICES environment variable; if not
   set, then defaults to local Redis server, no password

redisQueueConfig determines which strategy is used to configure the client.
It is easy to add your own strategy.

##Usage

###QueueMgr Coffescript Usage Example

1. Ensure you have a Redis server installed and running. For example, once installed, you can run it locally by

        redis-server &

1. Require `node-redis-queue` QueueMgr

        QueueMgr = require('node-redis-queue').QueueMgr

1. Create a QueueMgr instance and connect to Redis

        qmgr = new QueueMgr()  
        qmgr.connect ->
          console.log 'ready'
          myMainLogic()

  Alternatively, you can provide an existing Redis connection (i.e., a redis client instance)

        qmgr.attach redisConn

1. Optionally, handle error events

        qmgr.on 'error', (error) ->  
            console.log 'Stopping due to: ' + error  
            process.exit()

1. Optionally, handle lost connection events

        qmgr.on 'end', ->
          console.log 'Connection lost'

1. Optionally, clear previous data from the queue, providing a callback
   to handle the data.

        qmgr.clear queueName, ->
          console.log 'cleared'
          doImportantStuff()

1. Optionally, push data to your queue

        qmgr.push queueName, myData

1. Optionally, pop data off your queue

        qmgr.pop queueName, (myData) ->  
            console.log 'data = ' + myData

   or, alternatively, pop off any of multiple queues

        qmgr.popAny queueName1, queueName2, (myData) ->
            console.log 'data = ' + myData 

   Once popping data from a queue, avoid pushing data to the same queue from the same connection, since
   a hang could result. This appears to be a Redis limitation when using blocking reads.

1. When done, quit the QueueMgr instance

        qmgr.disconnect()

  or, alternatively, if consuming data from the queue, end the connection

        qmgr.end()

  or, if there may be a number of redis commands queued,

        qmgr.shutdownSoon()

###WorkQueueBroker Coffeescript Usage Example

1. Ensure you have a Redis server installed and running. For example, once installed, you can run it locally by

        redis-server &

1. Require `node-redis-queue` WorkQueueBroker

        WorkQueueBroker = require('node-redis-queue').WorkQueueBroker

1. Create a WorkQueueBroker instance and connect to Redis

        broker = new WorkQueueBroker()  
        broker.connect ->
          console.log 'ready'
          myMainLogic()

  Alternatively, you can provide an existing Redis connection (i.e., a redis client instance)

        broker.attach redisConn

1. Optionally, handle error events

        broker.on 'error', (error) ->  
            console.log 'Stopping due to: ' + error  
            process.exit()

1. Optionally, handle lost connection events

        broker.on 'end', ->
          console.log 'Connection lost'

1. Create a work queue instance

        queue = broker.createQueue queueName

1. Optionally, clear previous data from the queue, providing a callback
   to handle the data.

        queue.clear ->
          console.log 'cleared'   
          doImportantStuff()

1. Optionally, send data to your queue

        queue.send myData

1. Optionally, consume data from your queue and call ack when ready to consume another data item

        queue.consume (myData, ack) ->  
            console.log 'data = ' + myData   
            ...
            ack()

   If multiple queues are being consumed, they are consumed with highest priority given to the queues consumed first (i.e., in the order in which the consume statements are executed).

   Note that ack(true) may be used to indicate that no further data is expected from the given work queue.
   This is useful, for example, in testing, when a clean exit from a test case is desired.

   Once consuming from a queue, avoid sending data to the same queue from the same connection, since
   a hang could result. This appears to be a Redis limitation when using blocking reads.

1. Optionally, destroy a work queue if no longer consuming from it and there are other queues being
   consumed in the same process. Otherwise, not necessary.

        broker.destroyQueue queueName

1. When done, quit the WorkQueueBroker instance

        broker.disconnect()

  or, alternatively, if consuming data from the queue, end the connection

        broker.end()

  or, if there may be a number of redis commands queued,

        broker.shutdownSoon()

###QueueMgr Javascript Usage Example

1. Ensure you have a Redis server installed and running. For example, once installed, you can run it locally by

        redis-server &

1. Require `node-redis-queue` QueueMgr

        var QueueMgr = require('node-redis-queue').QueueMgr;


1. Create a QueueMgr instance and connect to Redis

        var qmgr = new QueueMgr();  
        qmgr.connect(function() {
          console.log('ready');
          myMainLogic();
        });

1. Optionally, handle error events

        qmgr.on('error', function(error) {  
            console.log('Stopping due to: ' + error);  
            process.exit();
        });

1. Optionally, handle lost connection events

        qmgr.on('end', function() {
          console.log('Connection lost');
        });

1. Optionally, clear previous data from the queue, providing a callback.

        qmgr.clear(function() {
          console.log('cleared');
          doImportantStuff();
        });

1. Optionally, push data to your queue

        qmgr.push(queueName, myData);

1. Optionally, pop data off your queue, providing a callback to
   handle the data

        qmgr.pop(queueName, function(myData) {  
            console.log('data = ' + myData); 
        });

   or, alternatively, pop off any of multiple queues

        qmgr.popAny(queueName1, queueName2, function(myData) {
            console.log('data = ' + myData);
        });

   Once popping data from a queue, avoid pushing data to the same queue from the same connection, since
   a hang could result. This appears to be a Redis limitation when using blocking reads.

1. When done, quit the QueueMgr instance

        qmgr.disconnect();

  or, alternatively, if monitoring, end the connection

        qmgr.end();

  or, if there may be a number of redis commands queued,

        qmgr.shutdownSoon();

###WorkQueueBroker Javascript Usage Example

1. Ensure you have a Redis server installed and running. For example, once installed, you can run it locally by

        redis-server &

1. Require `node-redis-queue` WorkQueueBroker

        var WorkQueueBroker = require('node-redis-queue').WorkQueueBroker;

1. Create a WorkQueueBroker instance and connect to Redis

        var broker = new WorkQueueBroker();  
        broker.connect(function () {
          console.log('ready');
          myMainLogic();
        });

  Alternatively, you can provide an existing Redis connection (i.e., a redis client instance)

        broker.attach(redisConn);

1. Optionally, handle error events

        broker.on('error', function(error) {   
            console.log('Stopping due to: ' + error);  
            process.exit();
        });

1. Optionally, handle lost connection events

        broker.on('end', function {   
          console.log('Connection lost');
        });

1. Create a work queue instance

        var queue = broker.createQueue(queueName);

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

   If multiple queues are being consumed, they are consumed with highest priority given to the queues consumed first (i.e., in the order in which the consume statements are executed).

   Note that ack(true) may be used to indicate that no further data is expected from the given work queue.
   This is useful, for example, in testing, when a clean exit from a test case is desired.

   Once consuming from a queue, avoid sending data to the same queue from the same connection, since
   a hang could result. This appears to be a Redis limitation when using blocking reads.

1. Optionally, destroy a work queue if no longer consuming from it and there are other queues being
   consumed in the same process. Otherwise, not necessary.

        broker.destroyQueue(queueName);

1. When done, quit the WorkQueueBroker instance

        broker.disconnect();

  or, alternatively, if consuming data from the queue, end the connection

        broker.end();

  or, if there may be a number of redis commands queued,

        qmgr.shutdownSoon();

##Running the demos -- preliminary steps

1. Open two Git Bash console windows.
1. In each window run `cd demo/lib` and then `export NODE_PATH=../../..`.
1. If redis-server is not already running, open an additional console window and run `redis-server` or `redis-server &` to start the Redis server in the background. The demos assume default login, no password.

##Running demo 01 -- QueueMgr example

This demo shows how to send a series of URLs to a consumer process that computes an SHA1 value for each URL.

1. In the first console window Run `node work01.js`. It will wait for some data to appear in the queue.
1. In the second console window, run `node provider01.js`, which will place four URLs in the queue. Shortly
   thereafter, the worker01 process will pick up the four URLs and display them, fetch a page body for each, and compute an SHA1 value for each.
1. Repeat step 2 a few times.
1. In the second console window, run `node provider01.js stop`, which will put a stop command in the queue. Shortly
   thereafter, the worker01 process will stop.

##Running demo 02 -- QueueMgr example

This demo shows how to send a series of URLs to a consumer process that computes an SHA1 value for each URL and returns the SHA1 result to the provider process.

1. In the first console window Run `node work02.js`. It will wait for some data to appear in the queue.
1. In the second console window, run `node provider02.js 01`, which will place four URLs in the queue. Shortly
   thereafter, the worker02 process will pick up the four URLs, display them, fetch a page body for each, and compute an SHA1 value for each, and then return the SHA1 result to the provider02 instance, which will display the result.
1. Repeat step 2 a few times.
1. In the second console window, run `node provider02.js stop`, which will put a stop command in the queue. Shortly
   thereafter, the worker02 process will stop.

##Running demo 03 -- WorkQueueBroker example

This demo shows how a worker can service multiple queues using WorkQueueBroker. The provider process, by default, sends three strings to one queue and three strings to the other.

1. In the first console window Run `node work03.js`. It will wait for some data to appear in the queue.
1. In the second console window, run `node provider03.js`, which will place three strings in each queue. Shortly
   thereafter, the worker03 process will pick up the six strings from their respective queues and display them.
1. Repeat step 2 a few times.
1. In the second console window, run `node provider03.js stop`, which will put a stop command in the queue. Shortly
   thereafter, the worker03 process will stop.

Note that, when running worker03, one optionally may use a 'mem' parameter to monitor memory usage. For example:

`node worker03.js mem | grep '>>>'`

When monitoring memory usage, run `node provider03.js 400` repeatedly, say as many as 50 times, to pump a sufficient amount of data to worker03 to detect any leaks. Sample memory usage output:

        >>>current = 3118200, max = 0
        >>>current = 3248152, max = 0
        >>>current = 3265896, max = 3265896
        >>>current = 3214184, max = 3265896
        >>>current = 3469112, max = 3469112
        >>>current = 3474064, max = 3474064
        >>>current = 3466856, max = 3474064
        >>>current = 3471904, max = 3474064
        >>>current = 3470080, max = 3474064

##Running demo 04 -- WorkQueueBroker example

This demo is almost the same as demo 02 but uses WorkQueueBroker rather than QueueMgr. It shows how to send a series of URLs to a consumer process that computes an SHA1 value for each URL and returns the SHA1 result to the provider process.

1. In the first console window Run `node work04.js`. It will wait for some data to appear in the queue.
1. In the second console window, run `node provider04.js 01`, which will place four URLs in the queue. Shortly
   thereafter, the worker04 process will pick up the four URLs, display them, fetch a page body for each, and compute an SHA1 value for each, and then return the SHA1 result to the provider04 instance, which will display the result.
1. Repeat step 2 a few times.
1. In the second console window, run `node provider04.js stop`, which will put a stop command in the queue. Shortly
   thereafter, the worker04 process will stop.

##Running the test suite

Use either `grunt test` or `npm test` to run the suite of tests using Mocha. The test cases reside in the `test` directory.

##Running grunt for development tasks

`grunt` runs coffeelint and then coffee.

`grunt coffeelint` runs coffeelint on all the .coffee source code in the src directory.

`grunt coffee` runs coffee on all the .coffee source code in the src directory, converting it to .js code in the
corresponding lib directory.

`grunt jshint` runs jshint on all the .js code except one in the demo/lib/helpers directory. Note that jshint may
have a lot of complaints about the generated .js code, but is useful to spot potential problems.

`grunt clean` runs a script that removes vim backup files (i.e., files ending with '~' and .js files in the test directory).

`grunt test` runs the suite of tests using Mocha. It looks for .coffee files in the test directory.

`grunt bump` bumps the patch number up in the package.json file.

`grunt git-tag` commits the latest staged code changes and tags the code with the version obtained from the package.json file.

`grunt release` runs coffee on all the .coffee source code in the src directory, converting it to .js code, and
then runs the git-tag task to commit the latest staged code changes and tag the code with the version obtained from the
package.json file.

`grunt compile-test` runs coffee on the test .coffee code. This is only for debugging of test cases when you need to see the generated javascript code.

##Change Log

**v0.0.0**: Initial version.

**v0.0.1-3**: Changes to README.md. Implementation of jasmine-node tests.

**v0.1.2**: Refactored to implement new QueueMgr and WorkQueueBroker interfaces; Implementation of connection strategies. 

**v0.1.3**: Further Refactoring to implement new QueueMgr and WorkQueueBroker interfaces;   
Merged v0.1.3 from flex branch into master.

**v0.1.4**: Fix for issue #1 - Where to find redis-queue-config file is too restrictive - Now uses QUEUE_CONFIG_FILE environment variable to find the config file;   
An alternative is to specify the config file path in the queueMgr or workQueueBroker constructor.
Changed testing from Jasmine to Mocha.; Implemented Mocha tests;      
Introduced interleaved tests.

**v0.1.5**: Various comment and README.md changes;   
Corrected error in provision of Redis Cloud hostname;

**v0.1.6**: Compiled to capture latest mod to .coffee source.

**v0.1.7**: Fix for issue #4 - Stall occurs when one of two work queues on same connection becomes empty.

**v0.1.8**: Fix for REDISCLOUD_URL having no auth field; Created change log in README.md.

**v0.1.9**: Added usage examples to README.md for WorkQueueBroker. Added commandQueueLength function 
to permit some rudimentary control of backpressure. Documented 'drain' event.

**v0.1.10**: Changed `grunt test` to use mocha rather than jasmine-node. Improved usage documentation.

**v0.1.11**: Added shutdownSoon function to QueueMgr and WorkQueueBroker. Improved README.md and demos. Made test suite
use unique queue names to prevent interference from demos.

**v0.1.12**: Modified WorkQueueMgr to preserve the order of
queue names used when calling popAny. ECMA-262 5.1 (15.2.3.14 Object.keys and 12.6.4 The for-in Statement) does not specify enumeration order, so an array should be used. Also, see: https://code.google.com/p/v8/issues/detail?id=164

**v0.1.13**: Modified connStrategyBlueMixRedisCloud to use a configured redis version. Added config info to README.md.

**v0.1.14**: Added 'clean' task to Gruntfile. Fixed some potential problems found by jshint. Tidied Gruntfile.
Replaced some URLs in the demo source that were no longer working (404 not found).

**v0.1.15**: Send now checks that queue has not been destroyed.
Added 'compile-test' task to Gruntfile. Fixed
incorrect calls to isValidQueueName. Added tests for WorkQueue
exceptions. Grunt now uses grunt-mocha-test plugin for better
reporting.

##Note:

Part of this work is derived from node-simple-redis-queue v0.9.3 by James Smith and
retains the same license. However, the current version bears almost no resemblance
to James' project.
