
global.debug = require('./lib/debug')();

// load main library and controllers
var adminionServer = require('./lib/');

// create a server instance
var Adminion = adminionServer();

debug.emit('val', 'Adminion', Adminion, 'worker.js', 10);

// now sit back and wait for requests
Adminion.start();