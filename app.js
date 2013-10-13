
global.debug = require('./lib/debug')();

debug.marker('Starting Adminion Game Server...', 'app.js', 4);

// load main library and controllers
var AdminionServer = require('./lib/');

// create a server instance
var Adminion = AdminionServer();

// if (Adminion.config.debug) {
// 	Adminion.on('listening', function() {
// 		debug.emit('msg', 'doing something after server has started listening...', 'app.js', 11);
// 	});
// }

// now sit back and wait for requests
Adminion.Start();


