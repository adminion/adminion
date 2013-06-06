/**
 * 	debug.js - smb wrapper for console.log & console.err 
 * 
 */
 
var debug = module.exports = {}

debug.vars = function (name, value, file, line) {
	console.log("%s %s - %s", file, line, name);
	console.log(value);
};

debug.msg = function (message, file, line) {
	console.log('%s %s: %s', file, line, message);
};

