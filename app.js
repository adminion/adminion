
global.debug = require('./lib/debug')();

// load main library and controllers
var adminionServer = require('./lib/');

// Eventually, I want to create a pool of server instances to handle requests.  
// if one fails: 
//  a) log the exception/reason for failure
//  b) kill the instance
//  c) create a new b

// create a server instance
var Adminion = adminionServer();

// if (Adminion.config.debug) {
//  Adminion.on('listening', function() {
//      debug.emit('msg', 'doing something after server has started listening...', 'app.js', 11);
//  });
// }

// now sit back and wait for requests
Adminion.start();


