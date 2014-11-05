node-redis-queue
=======

This is a very simple queing wrapper for Redis that is intended for communication between separate processes. It comes with two APIs:

1. Channel -- the push/pop interface

   The process creates a single instance of Channel.
   The sending process uses the Channel instance to push data onto the queue via the `push` function. The receiving process uses
   the Channel instance to remove data from the same queue via the `pop` function, which delivers the data to a callback function
   which accepts a single data parameter.

2. WorkQueueMgr -- the send/consume interface

   The process creates a single instance of WorkQueueMgr.
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

###Coffescript Usage Examples

See the Coffeescript usage examples [here](COFFEESCRIPT_USAGE_EXAMPLES.md).

###Javascript Usage Examples

See the Javascript usage examples [here](JAVASCRIPT_USAGE_EXAMPLES.md).

##Running the demos

Instructions for running the demo code may be found [here](demo/HOW_TO_RUN_DEMOS.md).

##Developer Info

For developers who wish to make changes to the code, information on running the test suite and how to use `grunt` may be found
[here](DEVELOPER_INFO.md);

##Change Log

View the change log [here](CHANGE_LOG.md).

##Architecture Notes

The Channel class is a very thin wrapper around existing redis module functions. It delegates all its
operations to that module. The Channel class uses different strategies to connect to redis.
A config file specifies which strategy to use and also supplies options to redis.

The WorkQueueMgr class delegates queue send and consume to the Channel class. It maintains a hash of queues created
(@queue), which defines which queues currently are valid. For each queue that is consuming data, it maintains an entry
in a hash of callbacks (@consumingCB) and and an entry in an ordered list of names of queues currently being consumed
(@consumingNames). The ordered list of names represents the priority for consumption of queue data and is used by the
consume function as the list of keys to be monitored by qmgr.popAny.

The WorkQueue class is a very simple envelope wrapping four applicative functions, effectively delegating
all operations to WorkQueueMgr class.

##Historical Note

Part of this work is derived from node-simple-redis-queue v0.9.3 by James Smith and
retains the same license. However, the current version bears almost no resemblance
to James' project.
