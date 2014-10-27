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

##Usage

###QueueMgr Coffescript Usage Example

1. Ensure you have a Redis server installed and running. For example, once installed, you can run it locally by

        redis-server &

2. Require `node-redis-queue` QueueMgr

        QueueMgr = require('node-redis-queue').QueueMgr

3. Create a QueueMgr instance and connect to Redis

        qmgr = new QueueMgr()  
        qmgr.connect ->
          console.log 'ready'
          myMainLogic()

  Alternatively, you can provide an existing Redis connection (i.e., a redis client instance)

        qmgr.attach redisConn

4. Optionally, clear previous data from the queue, providing a callback
   to handle the data.

        qmgr.clear queueName, ->
          console.log 'cleared'
          doImportantStuff()

5. Optionally, push data to your queue

        qmgr.push queueName, myData

6. Optionally, handle error events

        qmgr.on 'error', (error) ->  
            console.log 'Stopping due to: ' + error  
            process.exit()

7. Optionally, handle lost connection events

        qmgr.on 'end', ->
          console.log 'Connection lost'

8. Optionally, pop data off your queue

        qmgr.pop queueName, (myData) ->  
            console.log 'data = ' + myData

  or, alternatively, off multiple queues

        qmgr.popAny queueName1, queueName2, (myData) ->
            console.log 'data = ' + myData 

9. When done, quit the QueueMgr instance

        qmgr.disconnect()

  or, alternatively, if consuming data from the queue, end the connection

        qmgr.end()

###WorkQueueBroker Coffeescript Usage Example

1. Ensure you have a Redis server installed and running. For example, once installed, you can run it locally by

        redis-server &

2. Require `node-redis-queue` WorkQueueBroker

        WorkQueueBroker = require('node-redis-queue').WorkQueueBroker

3. Create a WorkQueueBroker instance and connect to Redis

        broker = new WorkQueueBroker()  
        broker.connect ->
          console.log 'ready'
          myMainLogic()

  Alternatively, you can provide an existing Redis connection (i.e., a redis client instance)

        broker.attach redisConn

4. Create a work queue instance

        queue = broker.createQueue queueName

5. Optionally, clear previous data from the queue, providing a callback
   to handle the data.

        queue.clear ->
          console.log 'cleared'   
          doImportantStuff()

6. Optionally, send data to your queue

        queue.send myData

7. Optionally, handle error events

        broker.on 'error', (error) ->  
            console.log 'Stopping due to: ' + error  
            process.exit()

8. Optionally, handle lost connection events

        broker.on 'end', ->
          console.log 'Connection lost'

9. Optionally, consume data from your queue and call ack when ready to consume another data item

        queue.consume (myData, ack) ->  
            console.log 'data = ' + myData   
            ...
            ack()

10. Optionally, destroy a work queue if no longer consuming from it and there are other queues being
   consumed in the same process. Otherwise, not necessary.

        broker.destroyQueue queueName

11. When done, quit the WorkQueueBroker instance

        broker.disconnect()

  or, alternatively, if consuming data from the queue, end the connection

        broker.end()


###QueueMgr Javascript Usage Example

1. Ensure you have a Redis server installed and running. For example, once installed, you can run it locally by

        redis-server &

2. Require `node-redis-queue` QueueMgr

        var QueueMgr = require('node-redis-queue').QueueMgr;


3. Create a QueueMgr instance and connect to Redis

        var qmgr = new QueueMgr();  
        qmgr.connect(function() {
          console.log('ready');
          myMainLogic();
        });

4. Optionally, clear previous data from the queue, providing a callback.

        qmgr.clear(function() {
          console.log('cleared');
          doImportantStuff();
        });

5. Optionally, push data to your queue

        qmgr.push(queueName, myData);

6. Optionally, handle error events

        qmgr.on('error', function(error) {  
            console.log('Stopping due to: ' + error);  
            process.exit();
        });

7. Optionally, handle lost connection events

        qmgr.on('end', function() {
          console.log('Connection lost');
        });

8. Optionally, pop data off your queue, providing a callback to
   handle the data

        qmgr.pop(queueName, function(myData) {  
            console.log('data = ' + myData); 
        });

9. When done, quit the QueueMgr instance

        qmgr.disconnect();

  or, alternatively, if monitoring, end the connection

        qmgr.end();

##WorkQueueBroker Javascript Usage Example

1. Ensure you have a Redis server installed and running. For example, once installed, you can run it locally by

        redis-server &

2. Require `node-redis-queue` WorkQueueBroker

        var WorkQueueBroker = require('node-redis-queue').WorkQueueBroker;

3. Create a WorkQueueBroker instance and connect to Redis

        var broker = new WorkQueueBroker();  
        broker.connect(function () {
          console.log('ready');
          myMainLogic();
        });

  Alternatively, you can provide an existing Redis connection (i.e., a redis client instance)

        broker.attach(redisConn);

4. Create a work queue instance

        var queue = broker.createQueue(queueName);

5. Optionally, clear previous data from the queue, providing a callback
   to handle the data.

        queue.clear(queueName, function() {
          console.log('cleared');
          doImportantStuff();
        });

6. Optionally, send data to your queue

        queue.send(myData);

7. Optionally, handle error events

        broker.on('error', function(error) {   
            console.log('Stopping due to: ' + error);  
            process.exit();
        });

8. Optionally, handle lost connection events

        broker.on('end', function {   
          console.log('Connection lost');
        });

9. Optionally, consume data from your queue and call ack when ready to consume another data item

        queue.consume(function(myData, ack) {  
            console.log('data = ' + myData);   
            ...
            ack();
        });

10. Optionally, destroy a work queue if no longer consuming from it and there are other queues being
   consumed in the same process. Otherwise, not necessary.

        broker.destroyQueue(queueName);

11. When done, quit the WorkQueueBroker instance

        broker.disconnect();

  or, alternatively, if consuming data from the queue, end the connection

        broker.end();

##Running grunt for development tasks

`grunt` runs coffeelint and then coffee.

`grunt coffeelint` runs coffeelint on all the .coffee source code in the src directory.

`grunt coffee` runs coffee on all the .coffee source code in the src directory, converting it to .js code in the
corresponding lib directory.

`grunt jshint` runs jshint on all the .js code except one in the demo/lib/helpers directory. Note that jshint has about
ten complaints about the index.js code. The other generated code is clean.

`grunt test` runs the suite of tests using jasmine-node. It looks for xxxSpec.js files in the lib directory.

`grunt bump` bumps the patch number up in the package.json file.

`grunt git-tag` commits the latest staged code changes and tags the code with the version obtained from the package.json file.

`grunt release` runs coffee on all the .coffee source code in the src directory, converting it to .js code, and
then runs the git-tag task to commit the latest staged code changes and tag the code with the version obtained from the
package.json file.

##Running the Jasmine tests using npm

`npm test` runs the suite of tests using jasmine-node.

##Running the demo 01 code

1. Open three Git Bash console windows.
2. In the first console window, run `redis-server` or `redis-server &` to start the Redis server in the background.
3. cd demo/lib
4. In the second console window Run `node work01.js`. It will wait for some data to appear in the queue.
5. In the third console window, run `node provider01.js`, which will place four URLs in the queue. Shortly
   thereafter, the worker01 process will pick up the four URLs and display them, fetch a page body for each, and compute an SHA1 value for each.
6. Repeat step 5 a few times.
7. In the third console window, run `node provider01.js stop`, which will put a stop command in the queue. Shortly
   thereafter, the worker01 process will stop.

Note that, when running worker01, one optionally may use a 'mem' parameter to monitor memory usage. For example:

`node worker01.js mem | grep '>>>' | tee memusage.out`

##Running the demo 02 code

The code now is available. Consult the first few lines of the demo src example files for instructions on how to run the demo.

##Running the demo 03 code

The code now is available. Consult the first few lines of the demo src example files for instructions on how to run the demo.

##Running the demo 04 code

The code now is available. Consult the first few lines of the demo src example files for instructions on how to run the demo.

##Change Log

**v0.0.0**: Initial version.

**v0.0.1-3**: Changes to README.md.

**v0.1.2**: Refactored to implement new QueueMgr and WorkQueueBroker interfaces;   
Implementation of connection strategies. 

**v0.1.3**: Further Refactoring to implement new QueueMgr and WorkQueueBroker interfaces;   
Merged v0.1.3 from flex branch into master.

**v0.1.4**: Implementation of jasmine-node tests.   
Changed testing from Jasmine to Mocha.; Implemented Mocha tests;      
Introduced interleaved tests.;   
Fix for issue #1 - Where to find redis-queue-config file is too restrictive -   
Now uses QUEUE_CONFIG_FILE environment variable to find the config file;   
An alternative is to specify the config file path in the queueMgr or workQueueBroker constructor.  

**v0.1.5**: Various comment and README.md changes;   
Corrected error in provision of Redis Cloud hostname;

**v0.1.6**: Compiled to capture latest mod to .coffee source.

**v0.1.7**: Fix for issue #4 - Stall occurs when one of two work queues on same connection becomes empty.

**v0.1.8**: Fix for REDISCLOUD_URL having no auth field; Created change log in README.md.

**v0.1.9**: Added usage examples to README.md for WorkQueueBroker. Added commandQueueLength function 
to permit some rudimentary control of backpressure. Documented 'drain' event.

##Note:

Part of this work is derived from node-simple-redis-queue v0.9.3 by James Smith and
retains the same license. However, the current version bears almost no resemblance
to James' project.
