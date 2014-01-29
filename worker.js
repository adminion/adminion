
var cluster = require('cluster');

if (cluster.isMaster) {
    console.log('Starting Adminion game server...');
}

var util = require('util'),
    AdminionServer = require('./lib/'),
    utils = require('./lib/utils');

global.debug = require('./lib/debug')();

debug.emit('val', 'AdminionServer', AdminionServer);

AdminionServer.on('error', AdminionServer.kill);

AdminionServer.on('ready', function ready () {

    if (cluster.isMaster) {

        console.log('Adminion Game Server ready --> ', AdminionServer.env.url());

        debug.emit('val', 'mem.heapTotal', mem.heapTotal);

    } else if (cluster.isWorker) {

        debug.emit('msg', 'worker ' + cluster.worker.id + ' ready!');
    
        var mem = process.memoryUsage();
        process.send({'ready': true, 'memoryUsage': mem.heapTotal});
    }

    return true;
});

AdminionServer.start();