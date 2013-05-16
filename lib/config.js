/**
 * configuration file 
 * 
 * assigns a map of configuration settings to module.exports
 */
var configFile = require('../config');

var prefix = process.cwd();

var config = module.exports = {};

// module property		config file values			defaults if no configuration
config.serverName = 	configFile.serverName 	|| 'Adminion'; 
config.host = 			configFile.host 		|| 'localhost';
config.port = 			configFile.port 		|| '1337';

// if https evaluates to true in config file, set config.https to:
config.https = (!!configFile.https) 
	// an object with certificate and key file properties
	? { cert: prefix + '/.ssl' + (configFile.cert || "/adminion-cert.pem"),
		key: prefix + '/.ssl' + (configFile.key || "/adminion-key.pem"), 
		requestCert : configFile.requestCert || true,
		rejecdtUnauthorized : configFile.rejectUnauthorized || false }
	// else null
	: null;

config.views = configFile.views || 'views';
config.viewEngine = configFile.viewEngine || 'jade';

console.log('lib/config.js module.exports', module.exports);
