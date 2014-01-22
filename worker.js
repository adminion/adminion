
var cluster = require('cluster'),
    util = require('util');

if (cluster.isMaster) {
    console.log('Starting Adminion game server...');
}

global.debug = require('./lib/debug')();

// create a server instance
var AdminionServer = require('./lib/'),
    utils = require('./lib/utils');

debug.emit('val', 'AdminionServer', AdminionServer);

AdminionServer.on('error', AdminionServer.kill);

AdminionServer.on('ready', function ready () {

    // if we're the master process (ie: `node worker.js`)
    if (cluster.isMaster) {

        // Output that the server is ready
        console.log('Adminion Game Server ready --> ', AdminionServer.env.url());

        debug.emit('val', 'mem.heapTotal', mem.heapTotal);

    } else if (cluster.isWorker) {

        debug.emit('msg', 'worker ' + cluster.worker.id + ' ready!');
    
        var mem = process.memoryUsage();
        process.send({'ready': true, 'memoryUsage': mem.heapTotal});
    }

    return true;
});

// now sit back and wait for requests
AdminionServer.start();