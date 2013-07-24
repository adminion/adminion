/**
 * configuration file 
 * 
 * assigns a map of configuration settings to module.exports
 */
// this is set to ../config to get /config.json
var config = {}
	, configFile = require('../config');


// module property		config file values			defaults if no configuration
config.debug = 			configFile.debug			|| false;

config.serverName = 	configFile.serverName 		|| 'Adminion'; 
config.host = 			configFile.host 			|| 'localhost';
config.port = 			configFile.port 			|| '1337';
config.mongodb = 		configFile.mongodb 			|| 'mongodb://localhost/adminion';
config.views = 			configFile.views 			|| 'views';
config.viewEngine = 	configFile.viewEngine 		|| 'jade';

// if https evaluates to true in config file, set config.https to:
config.https = (!!configFile.https) 
	// an object with https server options
	? require('./ssl')
	// else null
	: null;

config.session = {
	// maxAge is the number of milliseconds till expiry!
	cookie : configFile.cookie || { maxAge : /* 5 hours */ 5 * 60 * 60 * 1000 }
	, secret : configFile.secret 	|| '$4$1M1KLxrb$h0ynxcy1IZ0wQltG+iqdYZCmcfg$'
};

config.locals = (configFile.locals) 
	? configFile.locals 
	: {
		links : {
			"Games" : "/games"
			, "Players" : "/players"
		}
	};

module.exports = config;

// debug.emit('var', 'config', config, 'lib/config.js', 45);