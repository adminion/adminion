
global.debug = require('./lib/debug')();

var AdminionCluster = require('cluster');

// create a server instance
var Adminion = require('./lib/');

// debug.emit('val', 'Adminion', Adminion, 'worker.js', 10);

// now sit back and wait for requests
Adminion.start();

Adminion.on('ready', function () {
	process.send({'ready': true, 'memoryUsage': process.memoryUsage().heapTotal});
});

Adminion.on('error', Adminion.kill);