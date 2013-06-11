
global.debug = require('./lib/debug');

// load main library and controllers
global.Adminion = require('./lib/');

// now sit back and wait for requests
Adminion.Start();

if (Adminion.config.debug) {
	Adminion.on('listening', function() {
//		debug.emit('msg', 'doing something after server has started listening...', 'app.js', 11);
	});
}
