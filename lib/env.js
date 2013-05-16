/**
 * env.js
 * 
 * smb environment module
 * 
 */

var config 	= require('./config');

var env = module.exports = {}; 

env.prefix = 		process.cwd();
env.serverName = 	config.serverName;
env.url	= 			config.protocol + '://' + config.host + ':' + config.port;

console.log('lib/env.js module.exports', module.exports);
