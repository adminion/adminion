
global.debug = require('./lib/debug');

// load main library and controllers
global.Adminion = require('./lib/');

if (Adminion.config.debug) {
	Adminion.on('listening', function() {
//		debug.emit('msg', 'doing something after server has started listening...', 'app.js', 11);
	});
}

// now sit back and wait for requests
Adminion.Start();

