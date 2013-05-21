/**
 * 	logger.js - smb wrapper for console.log & console.err 
 * 
 */

// get required modules
var util = require('util');

var logger = module.exports = require('events');

function stdout(msg, args) {
	// add the message to the args array
	args.unshift(util.format('[%s] %s', new Date(), msg));
	
	// apply console.log as console with an array of arguments
	console.log.apply(console, args);
};

logger.stdout = stdout;
