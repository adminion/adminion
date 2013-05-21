/**
 * env.js
 * 
 * smb environment module
 * 
 */


var env = module.exports = {}; 
env.prefix = process.cwd();

var config 	= require('./config');
var protocol = (config.https) ? 'https' : 'http';

env.serverName = 	config.serverName;
env.url	= 			protocol + '://' + config.host + ':' + config.port;

//console.log('lib/env.js module.exports', module.exports);
