/**
 * 	debug.js - smb wrapper for console.log & console.err 
 * 
 */
 
var events = require('events')
	, util = require('util');

module.exports = function () {

	var debug = Object.create(events.EventEmitter.prototype);
	
	debug.val = function (name, value, file, line) {
		console.log("\nDEBUG: %s %s - %s", file, line, name);
		console.log(value);
		console.log();
	};
	
	debug.msg = function (message, file, line) {
		console.log('\nDEBUG: %s %s: %s\n', file, line, message);
	};

	debug.marker = function (label, file, line) {
		var marker = '';

        for (var i = 0; i < process.stdout.columns; i +=1 ) {
            marker += '-';
        }

        console.log(marker);
    	debug.msg(label, file, line);
        console.log(marker);

	};

	debug.on('val', debug.val);
	debug.on('msg', debug.msg);
	debug.on('marker', debug.marker);

	return debug;
}

