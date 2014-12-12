exports.Channel =  require('./lib/channel').channel;
exports.WorkQueue = require('./lib/workQueueMgr').queue;
exports.WorkQueueMgr = require('./lib/workQueueMgr').mgr;
exports.getClient = require('./lib/redisQueueConfig').getClient;
