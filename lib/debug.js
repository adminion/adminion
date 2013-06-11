/**
 * 	debug.js - smb wrapper for console.log & console.err 
 * 
 */
 
var events = require('events');

function Debug() {

	// call EventEmitter constructor;
	events.EventEmitter.call(this);
	
	this.vars = function (name, value, file, line) {
		console.log("%s %s - %s", file, line, name);
		console.log(value);
	};
	
	this.msg = function (message, file, line) {
		console.log('%s %s: %s', file, line, message);
	};

}

// Copies all of the EventEmitter properties 
Debug.prototype.__proto__ = events.EventEmitter.prototype;

Debug = module.exports = new Debug();

Debug.on('var', Debug.vars);
Debug.on('msg', Debug.msg);
