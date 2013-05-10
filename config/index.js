/**
 * configuration file 
 * 
 * assigns a map of configuration settings to module.exports
 */
 var express = require('./express');

var config = module.exports = {
	appName : 'Adminion', 
	express : express,
	banner : {
		title: 	'Adminion',
		src: 	'/images/logo-meadows-white.png',
		url: 	express.host +':'+express.port
	}
};

console.log('config', config);
