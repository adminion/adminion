/**
 * configuration file for smb
 * 
 * assigns a map of configuration settings to module.exports
 */

// get this directory string, the split it into an array
var prefix = __dirname.split('/');

// pop this directory off the end of the array
prefix.pop();

// put the array back together 
prefix = prefix.join('/');

// output the result 
//console.log('prefix: %j', prefix);

var config = module.exports = {
	appName : 'IT Help Desk', 
	prefix	: prefix, 
};

config.banner = {
	title: 	'Mt. Hood Meadows Ski Resort',
	src: 	'/images/logo-meadows-white.png',
	url: 	'www.skihood.com'
},

config.express = require('./express');

console.log('config', config);
