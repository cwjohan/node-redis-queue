node-redis-queue
=======

This is a very simple queing wrapper for Redis that is intended for communication between separate processes.

The sending process pushes data onto the queue using the `push` function. The receiving process monitors for data
appearing in the queue using the `monitor` function. The receiving process listens for a 'message' event, which
delivers the data to a callback function.

Additional functions include `clear` to clear the queue and `stopMonitoring` to indicate that no further monitoring
is desired.

##Installation

    npm install node-redis-queue --save

##Usage

###Coffescript Usage Example

1. Ensure you have a Redis server installed and running. For example, once installed, you can run it locally by

        redis-server &

2. Require `node-redis-queue`

        RedisQueue = require 'node-redis-queue'

3. Create a RedisQueue instance and connect to Redis

        myQueue = new RedisQueue  
        myQueue.connect()

  Alternatively, you can provide an existing Redis connection

        myQueue.connect redisConn

4. Optionally, clear previous data from the queue

        myQueue.clear myQueueName

5. Optionally, push data to your queue

        myQueue push myQueueName, myData

6. Optionally, handle error events

        myQueue.on 'error', (error) ->  
            console.log 'Stopping due to: ' + error  
            process.exit()

7. Optionally, handle timeout events

        myQueue.on 'timeout', ->  
            console.log 'timeout event'

8. Optionally, handle 'message' events and subsequently monitor for data in the queue

        myQueue.on 'message', (queueName, myData) ->  
            console.log 'data = ' + myData 
        ...  
        myQueue.monitor timeout, myQueueName

  The timeout is in seconds.

9. When done, quit the Redis client

        myQueue.disconnect()

  or, alternatively

        myQueue.end()

###Javascript Usage Example

1. Ensure you have a Redis server installed and running. For example, once installed, you can run it locally by

        redis-server &

2. Require `node-redis-queue`

        var RedisQueue = require('node-redis-queue');


3. Create a RedisQueue instance and connect to Redis

        var myQueue = new RedisQueue();  
        myQueue.connect();

4. Optionally, clear previous data from the queue

        myQueue.clear(myQueueName);

5. Optionally, push data to your queue

        myQueue.push(myQueueName, myData);

6. Optionally, handle error events

        myQueue.on('error', function(error) {  
            console.log('Stopping due to: ' + error);  
            process.exit();
        });

7. Optionally, handle timeout events

        myQueue.on('timeout', function() {  
            console.log('timeout event');
        });

8. Optionally, handle 'message' events and subsequently monitor for data in the queue

        myQueue.on('message', function(queueName, myData) {  
            console.log('data = ' + myData); 
        });
        ...  
        myQueue.monitor(timeout, myQueueName);

  The timeout is in seconds.

9. When done, quit the Redis client

        myQueue.disconnect();

  or, alternatively,

        myQueue.end();

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

1. Open two Git Bash console windows.
2. In one of the console windows, run `redis-server &` to start the Redis server in the background.
3. Run `node lib/work01.js` in the first console window. It will wait for some data to appear in the queue.
4. In the second console window, run `node lib/provider01.js`, which will place two items in the queue. Shortly
   thereafter, the worker01 process will pick up the two items and display them.
5. Repeat step 4.
6. In the second console window, run `node lib/provider01.js stop`, which will put a stop command in the queue. Shortly
   thereafter, the worker01 process will stop.

Note that, when running worker01, one optionally may use a 'mem' parameter to monitor memory usage. For example:

`node worker01.js mem | grep '>>>' | tee memusage.out`

##Running the demo 02 code

Not available yet.

##Note:

This work is derived from node-simple-redis-queue v0.9.3 by James Smith and
retains the same license. I chose not to fork the project directly since I
want to be free to make major changes and to have control over future changes
since this code will be published in other media.

Changes from the original code include:

1. Different error handling.
2. Transparent use of JSON.stringify and JSON.parse to ensure
   that what you get out of the queue is the same as what you put in.
3. Addition of a timeout parameter to the monitor function.
4. Addition of a connect function that optionally takes an existing Redis client as an argument.
5. Emitting of connection 'end' events.
6. Emitting of connection 'error' events.
7. Emitting of Redis wait 'timeout' events.
8. Addition of tests using jasmine-node.
9. Addition of demo code in the demo directory.
10. Addition of a disconnect function.
11. Addition of a stopMonitoring function.
12. Changes to the Gruntfile to use coffeelint and jshinti and to run the test suite.


