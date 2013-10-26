/**
 * configuration file 
 * 
 * assigns a map of configuration settings to module.exports
 */

var os = require('os');

// this is set to ../config to get /config.json
var config = {}
	, configFile = require('../config.json');


// config property				config file values				defaults if no configuration
config.debug = 					configFile.debug				|| false;

config.cacheUpdateInterval =	configFile.cacheUpdateInterval 	|| 5 * 60 * 1000 // 5 minutes in milliseconds
config.serverName = 			configFile.serverName 			|| 'Adminion'; 
config.host = 					configFile.host 				|| 'localhost';
config.port = 					configFile.port 				|| '1337';
config.mongodb = 				configFile.mongodb 				|| 'mongodb://localhost/adminion';
config.views = 					configFile.views 				|| 'views';
config.viewEngine = 			configFile.viewEngine 			|| 'jade';

// get the number of CPUs available to the OS
var numCpus = os.cpus().length;

// if the config file value is 'auto', use the number of cpus, else convert the value to a Number
var numWorkers = (configFile.workers === 'auto') ? numCpus : Number(configFile.workers);

// if the number of workers is not Nan (...is a number... silly javascript >_<), AND 
// that number is not greater than the number of cpus, use that number, otherwise only use 1
config.workers = ( !Number.isNaN(numWorkers) && !(numWorkers > numCpus)) ? numWorkers : 1;

// if https evaluates to true in config file, set config.https to:
config.https = (!!configFile.https) 
	// an object with https server options
	? require('./ssl')
	// else null
	: false;

config.session = {
	// maxAge is the number of milliseconds till cookie expiry
	// 5 hours in milliseconds = 5 * 60 * 60 * 1000
	cookie : configFile.cookie || { maxAge : 5 * 60 * 60 * 1000 } 
	// we recommend creating your own secret... 
	, secret : configFile.secret 	|| '$4$1M1KLxrb$h0ynxcy1IZ0wQltG+iqdYZCmcfg$'
};

config.locals = (configFile.locals) 
	? configFile.locals 
	: {
		links : {
			"Games" : "/games"
			, "Accounts" : "/accounts"
		}
	};

module.exports = config;

// debug.emit('val', 'config', config, 'lib/config.js', 45);