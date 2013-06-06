/**
 * configuration file 
 * 
 * assigns a map of configuration settings to module.exports
 */
// this is set to ../config to get /config.json
var configFile = require('../config');
var config = module.exports = {};

// module property		config file values			defaults if no configuration
config.debug = 			configFile.debug		|| false;

config.serverName = 	configFile.serverName 	|| 'Adminion'; 
config.host = 			configFile.host 		|| 'localhost';
config.port = 			configFile.port 		|| '1337';
config.mongodb = 		configFile.mongodb 		|| 'mongodb://localhost/adminion';
config.views = 			configFile.views 		|| 'views';
config.viewEngine = 	configFile.viewEngine 	|| 'jade';

// if https evaluates to true in config file, set config.https to:
config.https = (!!configFile.https) 
	// an object with https server options
	? ssl = require('./ssl')
	// else null
	: null;



//console.log('lib/config.js module.exports', module.exports);
