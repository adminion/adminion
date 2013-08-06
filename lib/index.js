
// node core modules
var events = require('events');

// adminion core modules
var auth = 			require('./auth')
	, db = 			require('./db')
	, http = 		require('./http')
	, realtime = 	require('./realtime');

// Adminion Server Instance
var Server;

// define AdminionServer constructor
function AdminionServer() {

	// call events.EventEmitter's constructor on this
	events.EventEmitter.call(this);

	this.config = require('./config');
	this.env 	= require('./env');

	// public method for starting game server
	this.Start = function () {
		// console.log('Starting AdminionServer...');
		this.emit('serverStart');
	};
};

// copies all of the EventEmitter properties
AdminionServer.prototype.__proto__ = events.EventEmitter.prototype;

// create a server instance
Server = new AdminionServer();

// when 'serverStart' is emitted, initialize  db
function dbInit() {
	console.log('Initializing database...');
	db(Server, function (instance) {
		Server.db = instance;
		Server.emit('dbReady');
	});
};

// when db is ready, initialize auth
function authInit() {
	console.log('Initializing authorization system...');
	auth(Server, function (instance) {
		Server.auth = instance;
		Server.emit('authReady');
	});
};

// when auth is ready, initialize http
function httpInit() {
	console.log('Initializing webserver...')
	http(Server, function (instance) {
		Server.http = instance;
		Server.emit('httpReady');
	});
};

// when http is ready, initialize realtime
function realtimeInit() {
	console.log('Initializing realtime subsystem...');
	realtime(Server, function (instance) {
		Server.realtime = instance;
		Server.emit('realtimeReady');
	});
};

function serverListening() {
	console.log("\nAdminion Game Server listening --> %s\n", Server.env.url());
	Server.emit('listening');
};

Server.on('serverStart', dbInit);
Server.on('dbReady', authInit);
Server.on('authReady', httpInit);
Server.on('httpReady', realtimeInit);
Server.on('realtimeReady', serverListening);

module.exports = Server;
