node-redis-queue
=======

This is a very simple queing wrapper for Redis that is intended for communication between separate processes.

The user pushes data onto the queue using the **_push_** command and monitors for data appearing in the queue using
the **_monitor_** command.

Additional commands include **_clear_** to clear the queue and **_stopMonitoring_** to indicate that no further monitoring
is desired.

