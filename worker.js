
console.log('needle');
var cluster = require('cluster');

if (cluster.isMaster) {
    console.log('Starting Adminion game server...');
}

var util = require('util'),
    AdminionServer = require('./lib/'),
    utils = require('./lib/utils');

global.debug = require('./lib/debug')();

debug.emit('val', 'AdminionServer', AdminionServer);

var server = AdminionServer();

debug.emit('val', 'server', server);

server.on('error', server.kill);

server.on('ready', function ready () {
    var mem = process.memoryUsage();

    if (cluster.isMaster) {

        console.log('Adminion Game Server ready --> ', server.env.url());

        debug.emit('msg', util.format('total memory usage: %d MB', mem.heapTotal / utils.MB));

    } else if (cluster.isWorker) {

        debug.emit('msg', 'worker ' + cluster.worker.id + ' ready!');
    
        process.send({'ready': true, 'memoryUsage': mem.heapTotal});
    }

    return true;
});

server.start();
