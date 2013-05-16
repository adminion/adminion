/**
 * env.js
 * 
 * smb environment module
 * 
 */

var env = module.exports = {}; 

// repace '/lib' with ''
env.prefix 	= __dirname.replace(/\/lib$/, '');

var config 	= require('../config/');

env.appName	= config.appName;
env.banner 	= config.banner;

env.url		= function () {
	return config.express.protocol + '://' + config.express.host + ':' + config.express.port;
};;

