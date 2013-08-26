
// node core modules
var events = require('events');

// adminion core modules
var Auth = 			require('./auth')
	, Db = 			require('./db')
	, Http = 		require('./http')
	, Realtime = 	require('./realtime');

// Adminion Server Instance
var Server = Object.create(events.EventEmitter.prototype);

Server.config 	= require('./config');
Server.env 		= require('./env');
Server.util 	= require('./util');


// when 'serverStart' is emitted, initialize  db
function dbInit () {
	console.log('Initializing database...');
	Db(Server);

	Server.db.on('ready', function () { 
		authInit();
	});
};

// when db is ready, initialize auth
function authInit () {
	console.log('Initializing authorization system...');
	Auth(Server);

	Server.auth.on('ready', function () { 
		httpInit(); 
	});
};

// when auth is ready, initialize http
function httpInit () {
	console.log('Initializing webserver...');

	Http(Server);

	Server.http.on('ready', function () { 
		realtimeInit();
	});
};

// when http is ready, initialize realtime
function realtimeInit () {
	console.log('Initializing realtime system...');

	Realtime(Server);

	Server.realtime.on('ready', function () { 
		serverListening(); 
	});
};

function serverListening() {
	var marker = '';

	for (var i = 0; i < process.stdout.columns; i +=1 ) {
		marker += '=';
	}

	console.log(marker);
	console.log("\nAdminion Game Server listening --> %s\n", Server.env.url());
	console.log(marker);

	Server.emit('listening');
};

// public method for starting game server
Server.Start = function () {
	// console.log('Starting AdminionServer...');
	dbInit();
};

module.exports = Server;
