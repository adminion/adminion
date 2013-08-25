
global.debug = require('./lib/debug');

console.log('\nStarting Adminion Game Server...\n');

// load main library and controllers
var AdminionServer = require('./lib/');

// create our instance
global.Adminion = Object.create(null);

Adminion = AdminionServer();

// if (Adminion.config.debug) {
// 	Adminion.on('listening', function() {
// 		debug.emit('msg', 'doing something after server has started listening...', 'app.js', 11);
// 	});
// }

// now sit back and wait for requests
Adminion.Start();
