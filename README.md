node-redis-queue
=======

## Overview

This is a very simple queing wrapper for Redis that is intended for communication between separate processes.
It comes with two APIs:

1. Channel -- the push/pop interface

   The process creates an instance of Channel.
   The sending process uses the Channel instance to push data onto the queue via the `push` function.
   The receiving process uses the Channel instance to remove data from the same queue via the `pop` function,
   which delivers the data to a callback function which accepts a single data parameter. Some variants of the
   `pop` function may have a timeout parameter so they don't block indefinitely.

1. WorkQueueMgr -- the send/consume interface

   The process creates an instance of WorkQueueMgr.
   Then, it uses that instance to create one or more instances of WorkQueue, each representing a different queue having a unique name.
   The sending process uses a WorkQueue instance to send data to the corresponding queue via the `send` function. The receiving process uses
   a WorkQueue instance to remove data from the corresponding queue via the `consume` function, which delivers the data to a callback function
   which accepts a data parameter and an ack parameter. The latter is a function that is called to indicate that the callback function
   is complete and is ready to accept some additional data, if any, in the queue. See the usage examples below and also
   the worker03 and worker04 files in the demo src or lib directories for examples of how to do this. To achieve greater throughput with
   `consume`, one may specify the number of async callback functions to operate in parallel. The later feature is referred to as 'arity'.
   One also may specify a timeout parameter so that `consume` doesn't block indefinitely.

   `consume` is different from `pop` in that a single call to `consume` can fetch multiple data items from the given queue, while `pop`
   must be called repeatedly to fetch items from the queue.

##Details of the Channel Interface

The Channel interface is implemented with a single `Channel` class, which represents a Redis client connection. It wraps a `redis`
module client object, which may be accessed as a property.

###The public methods of the `Channel` class are:

####constructor(configFilePath)

Optionally, takes a config file path, which may be overridden by the QUEUE_CONFIG_PATH
environment variable. One accesses the constructor most typically by something like `var channel = new Channel();`.

####connect(onReadyCB)

Obtains a single Redis client connection using the config file information. We refer to this as 'half-duplex' mode.
This method calls the given callback when the connection is ready.
The `client` property provides access to this connection, which is used internally for both
push/send and pop/consume operations.

####connect2(onReadyCB)

Obtains two Redis client connections using the config file information. We refer to this as 'full-duplex' mode.
This method calls the given callback when the connection is ready.
The `client2` property is used internally for push/send, while the `client` property
is used for pop/consume. Use this feature to avoid hangs on push/send when multiple pop/consume operations
may be outstanding.

####attach(client, client2)

This is an alternative to calling `connect`. It attaches to the given Redis client connection or connections.
The `client2` parameter is optional and may be omitted.

####push(queueName, data)

Pushes the given data into the queue specified by the given queue name.

####pop(queueName, onDataCB)

Blocks indefinitely waiting for data to become available in the queue specified by the given queue name,
at which time it calls the given callback with a single data parameter.

####popTimeout(queueName, timeout, onDataCB)

Blocks waiting for data to become available in the queue specified by the given queue name. While waiting,
it may time out after the specified timeout interval (seconds), at which time it emits a `timeout` event and returns.
Once data becomes available, it calls the callback with a single data parameter.

####popAny(queueNames..., onDataCB)

Blocks indefinitely waiting for data to become available in any of the queues specified by the given queue names,
at which time it calls the given callback with two parameters: a queue name and a data parameter.

####popAnyTimeout(queueNames..., timeout, onDataCB)

Blocks waiting for data to become available in any of the queues specified by the given queue names. While waiting,
it may time out after the specified timeout interval (seconds), at which time it emits a `timeout` event and returns.
Once data becomes available, it calls the callback with two parameters: a queue name and a data parameter.

####clear(queueNames..., onClearCB)

Removes the data from the queues specified by the given queue names. Calls the given callback
function once all the given queues have been cleared.

####disconnect()

Quits accepting data and closes the connection.

####end()

Closes the connection.

####shutdownSoon(delay)

Closes the connection after waiting for the redis client's offline_queue_length to go to zero. The delay
specifies the interval at which the offline_queue_length will be checked. Defaults to 500 milliseconds.

####commandQueueLength()

Returns the size of the Redis client's command queue (i.e., commands queued to be sent to Redis).

###The public properties of the `Channel` class are:

####client

This is a Redis client connection used for both push/send and pop/consume operations if opened with `connect`.
However, if opened with `connect2`, it is used only for pop/consume operations.

####client2

This also is a Redis client connection. If opened with `connect`, it is the same connection as the `client`
property. However, if opened with `connect2`, it is a seperate connection used only for
push/send operations.

####outstanding

This is a count of the number of pop/consume operations currently outstanding.

##Details of the WorkQueueMgr Interface

This interface is implemented with two classes: `WorkQueue` and `WorkQueueMgr`. The `WorkQueue` class represents
a single queue identified by its name. The `WorkQueueMgr` class represents a collection of WorkQueue instances.
It wraps a `Channel` instance that provides the Redis connection and push and pop functionality for those
work queues.

###The public methods of the `WorkQueue` class are:

####send(data)

Pushes data into the associated work queue.

####consume(onDataCB, arity, timeout)

Consumes data that becomes available in the associated work queue. The arity and timeout parameters are optional
and default to 1 and 0 respectively. A zero timeout implies indefinite blocking.

####clear(onClearCB)

Removes the data from the associated queue. Calls the given callback when the operation is complete.

####destroy()

Destroys the meta-data about this WorkQueue instance in the associated WorkQueueMgr class.

###The public properties of the `WorkQueue` class are:

####queueName

The name of the work queue represented by this class instance.

###The public methods of the `WorkQueueMgr` class are:

####constructor(configFilePath)

Optionally, takes a config file path, which may be overridden by the QUEUE_CONFIG_PATH
environment variable. Creates an internal Channel instance.

####connect(onReadyCB)

Obtains a single Redis client connection using the config file information. We refer to this as 'half-duplex' mode.
This method calls the given callback when the connection is ready.
The channel's `client` property provides access to this connection, which is used internally for both
push/send and pop/consume operations.

####connect2(onReadyCB)

Obtains two Redis client connections using the config file information. We refer to this as 'full-duplex' mode.
This method calls the given callback when the connection is ready.
The channel's `client2` property is used internally for push/send, while the channel's `client` property
is used for pop/consume. Use this feature to avoid hangs on push/send when multiple pop/consume operations
may be outstanding.

####attach(client, client2)

This is an alternative to calling `connect`. It attaches to a given Redis client connection or connections.
The `client2` parameter is optional and may be omitted.

####createQueue(queueName)

Returns a WorkQueue instance for the given queue name.

####clear(queueNames..., onClearCB)

Removes the data from one or more queues specified by the given queue names. Calls the given callback
function once all the given queues have been cleared.

####clearAll(onClearCB)

Removes data from all the queues that have been created by this WorkQueueMgr instance
and not subsequently destroyed. Calls the given callback function once all the queues
have been cleared.

####disconnect()

Quits accepting data and closes the connection.

####end()

Closes the connection.

####shutdownSoon(delay)

Closes the connection after waiting for the redis client's offline_queue_length to go to zero. The delay
specifies the interval at which the offline_queue_length will be checked. Defaults to 500 milliseconds.


####commandQueueLength()

Returns the size of the Redis client's command queue (i.e., commands queued to be sent to Redis).

###The public properties of the `WorkQueueMgr` class are:

####channel

This property provides access to the internal Channel instance, which may have been opened in
'half-duplex' mode or 'full-duplex' mode, depending on whether `connect` or `connect2` was used
to open the channel.

You may use the `channel` property, for example, to push response data to an arbitrary result queue when
consuming a request queue where the request specifies the name of the response queue to use. The
worker04 demo code shows how to do this.

##Events Emitted by Both Interfaces

####'error'

Emitted when an error is reported by Redis.

####'end'

Emitted when a connection to the Redis server has been lost.

####'timeout'

Emitted when a timeout occurs on a popTimeout operation, popAnyTimeout operation,
or on a consume operation with a timeout specified. The callback provided to
`on 'timeout'` receives two parameters:

1. `queueNames` -- one or more queue names on which the operation was waiting
when the timeout occurred.

1. `cancel` -- a function that may be called to prevent another outstanding blocking
operation from being performed. This is useful, for example, to get a clean exit from a test case.

####'drain'

Emitted when the TCP connection to the Redis server has been buffering, but is now writable. 
This event can be used to stream commands in to Redis and adapt to backpressure: Call commandQueueLength 
to detect when the length is too much, then use the `'drain'` event to resume sending data to the queue or queues.

##Installation

    npm install node-redis-queue --save

##Configuration

Sample configuration files may be found in the sample-configs directory. In each config file,
the `redis_provider` type setting specifies the strategy to use. The `verbose` setting, if true, specifies to
display the config file settings on startup.

The environment variable QUEUE_CONFIG_FILE specifies which config file is to be used.
If not set, it defaults to node-redis-queue/redis-queue-config.json, which specifies to use
the local Redis server with no password. If you do nothing, that is what you get.

Currently implemented strategies are:

####connStrategyDefaultLocal

Local Redis server, no password

####connStrategyCustom

Configurable host, port, and password; defaults to local Redis server, no password

####connStrategyHerokuRedisCloud

Host, port, and password specified by REDISCLOUD_URL environment variable; if not
set, then defaults to local Redis server, no password

####connStrategyBlueMixRedisCloud

Host, port, and password specified by VCAP_SERVICES environment variable; if not
set, then defaults to local Redis server, no password

Note that redisQueueConfig determines which strategy is used to configure the client.
It is easy to add your own strategy.

##Usage

###Coffescript Usage Examples

See the Coffeescript usage examples [here](COFFEESCRIPT_USAGE_EXAMPLES.md).

###Javascript Usage Examples

See the Javascript usage examples [here](JAVASCRIPT_USAGE_EXAMPLES.md).

##Running the demos

Instructions for running the demo code may be found [here](demo/HOW_TO_RUN_DEMOS.md).

##Developer Info

For developers who wish to make changes to the code, information on running the test
suite and how to use `grunt` may be found [here](DEVELOPER_INFO.md);

##Change Log

View the change log [here](CHANGE_LOG.md).

##Architecture Notes

The Channel class is a very thin wrapper around existing redis module functions. It delegates all its
operations to that module. The Channel class uses different strategies to connect to redis.
A config file specifies which strategy to use and also supplies options to the redis module.

The WorkQueueMgr class serves as a factory for WorkQueue class instances.

The WorkQueueMgr class delegates queue send and consume to the Channel class. It maintains a hash of queues created
(@queue), which defines which queues currently are valid. For each queue that is consuming data, it maintains an entry
in a hash of callbacks (@consumingCB) and and an entry in an ordered list of names of queues currently being consumed
(@consumingNames). The ordered list of names represents the priority for consumption of queue data and is used by the
consume function as the list of queues to be monitored by qmgr.popAny.

The WorkQueue class is a very simple envelope wrapping four functions, each bound to an instance of the WorkQueueMgr
class and the queue name, effectively delegating all operations to the WorkQueueMgr class and to that particular queue.

##Historical Note

Part of this work is derived from node-simple-redis-queue v0.9.3 by James Smith and
retains the same license. However, the current version bears almost no resemblance
to James' project.
