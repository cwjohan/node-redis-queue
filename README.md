node-redis-queue
=======

This is a very simple queing wrapper for Redis that is intended for communication between separate processes.

The user pushes data onto the queue using the `push` function and monitors for data appearing in the queue using
the `monitor` function.

Additional commands include **_clear_** to clear the queue and **_stopMonitoring_** to indicate that no further monitoring
is desired.

##Using grunt for development tasks

`grunt` runs coffeelint and then coffee.

`grunt coffeelint` runs coffeelint on all the .coffee source code in the src directory.

`grunt coffee` runs coffee on all the .coffee source code in the src directory, converting it to .js code.

`grunt bump` bumps the patch number up in the package.json file.

`grunt git-tag` commits the latest staged code changes and tags the code with the version obtained from the package.json file.

`grunt release` runs coffee on all the .coffee source code in the src directory, converting it to .js code, and
then runs the git-tag task to commit the latest staged code changes and tag the code with the version obtained from the
package.json file.

##Running the Jasmine tests using npm

`npm test` runs the suite of tests.

##Running the demo 01 code

1. Open two Git Bash console windows.
2. In one of the console windows, run `redis-server &` to start the Redis server in the background.
3. Run `node lib/work01.js` in the first console window. It will wait for some data to appear in the queue.
4. In the second console window, run `node lib/provider01.js`, which will place two items in the queue. Shortly
   thereafter, the worker01 process will pick up the two items and display them.
5. Repeat step 4.
6. In the second console window, run `node lib/provider01.js stop`, which will put '***stop***' in the queue. Shortly
   thereafter, the worker01 process will stop.

#Running the demo 02 code

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
3. Addition of an optional timeout parameter to the constructor.
4. Emitting of connection 'end' events.
5. Emitting of connection 'error' events.
6. Emitting of Redis wait 'timeout' events.
7. Addition of tests using jasmine-node.
8. Addition of demo code in the demo directory.
9. Changes to the Gruntfile to use coffeelint and jshint.


