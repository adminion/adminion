
/**
 *	Configuration file for express settings
 *
 */

// get system prefix
var previx = require('../lib/env').prefix;

var express = module.exports = {
	cert		: prefix + '/adminion-cert.pem',	// default: '/adminion-cert.pem'
	key			: prefix + '/adminion-key.pem',		// default: '/adminion-key.pem'
	host 		: 'localhost',						// default: 'localhost'
	port 		: '1337',							// default: '8080'	
	protocol	: 'http',							// default: 'http'
	pub 		: 'public',							// default: '..public'
	controllers	: prefix + '/controllers',			// default: '../routes'
	views		: prefix + '/views',				// default: './views' 
	viewEngine 	: 'jade'							// default: 'jade'
};

express.favicon = express.pub + '/favicon-dark.ico';

console.log('config/express.js - express: %j', express);
