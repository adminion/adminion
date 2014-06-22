
// node core
var fs = require('fs'),
	path = require('path');

// 3rd party
var debug = require('debug')('adminion:transport:http:ssl');

// adminion
	config = require('../../config');
	
var ssl = {
	data : {
		cert : fs.readFileSync(path.resolve(config.cert)).toString('ascii'),
		key : fs.readFileSync(path.resolve(config.key)).toString('ascii')
	}, 
	path : { 
		cert : path.resolve(config.cert), 
		key : path.resolve(config.key)
	}
};

module.exports = ssl;

debug('module.exports', module.exports)
