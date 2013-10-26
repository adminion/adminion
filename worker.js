
global.debug = require('./lib/debug')();

// load main library and controllers
var adminionServer = require('./lib/');

// create a server instance
var Adminion = adminionServer();

// now sit back and wait for requests
Adminion.start();