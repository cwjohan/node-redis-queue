##Running the demos -- preliminary steps

1. Open two Git Bash console windows.
1. In each window run `cd demo/lib` and then `export NODE_PATH=../../..`.
1. If redis-server is not already running, open an additional console window and run `redis-server` or `redis-server &` to start the Redis server in the background. The demos assume default login, no password.

##Running demo 01 -- Channel example

This demo shows how to send a series of URLs to a consumer process that computes an SHA1 value for each URL.

1. In the first console window Run `node worker01.js`. It will wait for some data to appear in the queue.
1. In the second console window, run `node provider01.js`, which will place four URLs in the queue. Shortly
   thereafter, the worker01 process will pick up the four URLs and display them, fetch a page body for each, and compute an SHA1 value for each.
1. Repeat step 2 a few times.
1. In the second console window, run `node provider01.js stop`, which will put a stop command in the queue. Shortly
   thereafter, the worker01 process will stop.

##Running demo 02 -- Channel example

This demo shows how to send a series of URLs to a consumer process that computes an SHA1 value for each URL and returns the SHA1 result to the provider process.

1. In the first console window Run `node worker02.js`. It will wait for some data to appear in the queue.
1. In the second console window, run `node provider02.js 01`, which will place four URLs in the queue. Shortly
   thereafter, the worker02 process will pick up the four URLs, display them, fetch a page body for each, and compute an SHA1 value for each, and then return the SHA1 result to the provider02 instance, which will display the result.
1. Repeat step 2 a few times.
1. In the second console window, run `node provider02.js stop`, which will put a stop command in the queue. Shortly
   thereafter, the worker02 process will stop.

##Running demo 03 -- WorkQueueMgr example

This demo shows how a worker can service multiple queues using WorkQueueMgr. The provider process, by default, sends three strings to one queue and three strings to the other.

1. In the first console window Run `node worker03.js`. It will wait for some data to appear in the queue.
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

##Running demo 04 -- WorkQueueMgr example

This demo is almost the same as demo 02 but uses WorkQueueMgr rather than Channel. It shows how to send a series of URLs to a consumer process that computes an SHA1 value for each URL and returns the SHA1 result to the provider process.

1. In the first console window Run `node worker04.js`. It will wait for some data to appear in the queue.
1. In the second console window, run `node provider04.js 01`, which will place four URLs in the queue. Shortly
   thereafter, the worker04 process will pick up the four URLs, display them, fetch a page body for each, and compute an SHA1 value for each, and then return the SHA1 result to the provider04 instance, which will display the result.
1. Repeat step 2 a few times.
1. In the second console window, run `node provider04.js stop`, which will put a stop command in the queue. Shortly
   thereafter, the worker04 process will stop.

Try the above again using `node worker04 3` in step 1. Observe that the worker will process three input requests in parallel and
that the results may become available in a different order than the input requests.

