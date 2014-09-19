node-redis-queue
=======

This is a very simple queing wrapper for Redis that is intended for communication between separate processes.

The user pushes data onto the queue using the **_push_** command and monitors for data appearing in the queue using
the **_monitor_** command.

Additional commands include **_clear_** to clear the queue and **_stopMonitoring_** to indicate that no further monitoring
is desired.

Note:

This work is derived from node-simple-redis-queue v0.9.3 by James Smith and
retains the same license. I chose not to fork the project directly since I
want to be free to make major changes and to have control over future changes
since this code will be published in other media.

Changes from the original code include:

1. Different error handling.
2. Transparent use of JSON.stringify and JSON.parse to ensure
   that what you get out of the queue is the same as what you put in.
3. Addition of an optional timeout parameter to the constructor.
4. Addition of tests using jasmine-node.
5. Addition of demo code in the demo directory.
6. Changes to the Gruntfile to use coffeelint and jshint.


