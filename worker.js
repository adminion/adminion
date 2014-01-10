
global.debug = require('./lib/debug')();

var cluster = require('cluster'),
    util = require('util');

// create a server instance
var AdminionServer = require('./lib/'),
    utils = require('./lib/utils');

debug.emit('val', 'AdminionServer', AdminionServer, 'worker.js', 10);

AdminionServer.on('error', AdminionServer.kill);

AdminionServer.on('ready', function () {

    var mem = process.memoryUsage();

    var msg = 'Adminion Game Server';

    if (cluster.isWorker) {
        msg += ' worker #' + cluster.worker.id;
    }

    msg += util.format(" ready --> %s", AdminionServer.env.url());
    
    debug.emit('marker', msg, 'worker.js', 26);
    debug.emit('msg', util.format('memory heap total: %s MB', mem.heapTotal / utils.MB), 'worker.js', 27);

    if (cluster.isWorker) {
        process.send({'ready': true, 'memoryUsage': mem.heapTotal});
    }

    return true;
});

// now sit back and wait for requests
AdminionServer.start();