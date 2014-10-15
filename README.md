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
   is complete and is ready to accept some additional data, if any, in the queue. See the worker03 and worker04 files in the demo src
   or lib directories for examples of how to do this.

`consume` is different from `pop` in that a single call to `consume` can fetch
multiple data items from the given queue, while `pop` must be called repeatedly to fetch items from the queue.

An additional function present in both interfaces is `clear`, which clears the given queue and then calls the provided callback.

##Events Emitted by Both Interfaces

* `'error'` -- emitted when an error is reported by Redis

* `'end'` -- connection lost from Redis server

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

  Alternatively, you can provide an existing Redis connection

        qmgr.attach redisConn

4. Optionally, clear previous data from the queue, providing a callback
   to handle the data.

        qmgr.clear queueName, ->
          console.log 'cleared'

5. Optionally, push data to your queue

        qmgr push queueName, myData

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

9. When done, quit the QueueMgr instance

        qmgr.disconnect()

  or, alternatively, if monitoring, end the connection

        qmgr.end()

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

        qmgr.clear(qmgrName, function() {
          console.log('cleared');
        });

5. Optionally, push data to your queue

        qmgr.push(qmgrName, myData);

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

##Note:

Part of this work is derived from node-simple-redis-queue v0.9.3 by James Smith and
retains the same license. However, the current version bears almost no resemblance
to James' project.
