##Change Log

**v0.0.0**: Initial version.

**v0.0.1-3**: Changes to README.md. Implementation of jasmine-node tests.

**v0.1.2**: Refactored to implement new QueueMgr and WorkQueueBroker interfaces; Implementation of connection strategies. 

**v0.1.3**: Further Refactoring to implement new QueueMgr and WorkQueueBroker interfaces;   
Merged v0.1.3 from flex branch into master.

**v0.1.4**: Fix for issue #1 - Where to find redis-queue-config file is too restrictive - Now uses
QUEUE_CONFIG_FILE environment variable to find the config file;   
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
queue names used when calling popAny. ECMA-262 5.1 (15.2.3.14 Object.keys and 12.6.4 The for-in Statement) does not
specify enumeration order, so an array should be used. Also, see: https://code.google.com/p/v8/issues/detail?id=164

**v0.1.13**: Modified connStrategyBlueMixRedisCloud to use a configured redis version. Added config info to README.md.

**v0.1.14**: Added 'clean' task to Gruntfile. Fixed some potential problems found by jshint. Tidied Gruntfile.
Replaced some URLs in the demo source that were no longer working (404 not found).

**v0.1.15**: Send now checks that queue has not been destroyed.
Added 'compile-test' task to Gruntfile. Fixed
incorrect calls to isValidQueueName. Added tests for WorkQueue
exceptions. Grunt now uses grunt-mocha-test plugin for better
reporting.

**v0.1.16**: Reverted WorkQueue behaviour back to previous version since v0.1.15 change was too restrictive.
Added destroy function to WorkQueue. Updated README.md with info about the new destroy function. Also, added
some architecture notes.

**v0.1.17**: Added ability to schedule parallel jobs in the consume function via an optional arity parameter.
Added @outstanding to queueMgr class. worker04 example uses a second WorkQueueBroker instance when arity is
greater than 1 to send result back to provider04.

**v0.2.0**: Renamed QueueMgr class to Channel. Renamed WorkQueueBroker class to WorkQueueMgr. Updated test
and demo code to use the new class names. Hopefully, these make more sense.
The README.md file has been split up into several separate files to improve readability.

**v0.2.1**: Very minor update to the README.md to make it link to the HOW_TO_RUN_DEMOS.md file.

**v0.2.2**: To the Channel class, added new functions `popTimeout` and `popAnyTimeout` that accept a timeout
parameter. To the WorkQueueMgr class `consume` method, added an
optional timeout, which defaults to 0.
The Channel and WorkQueueMgr classes now both emit 'drain' and 'timeout' events. Made several WorkQueueMgr methods private:
send, consume, destroy, and ensureValidQueueName. Really, these were not meant to be used externally.
One is supposed to do those operations via the WorkQueue instance. Dropped useless isValidQueueName method.

**v0.2.3**: Implemented the 'full-duplex' feature, an optional second Redis client connection that may
be used to keep push/send operations separate from pop/consume operations. One opens the connection in
'full-duplex' mode by calling `connect2` rather than `connect`. Updated the worker04 demo program
to use the feature. Added a test case for this feature to the WorkQueueMgr test spec. The push and
send operations now emit an 'error' event if there are multiple outstanding pop or consume operations
outstanding. This signals when a hang likely would happen. If you get one of these errors, then use
`connect2` rather than `connect`.

**v0.2.4**: Cleaned up some sloppiness around attaching to and closing of multiple connections.
Added `clearAll` function to WorkQueueMgr. Modified provider03 demo program to use clearAll.

