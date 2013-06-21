/**
 * env.js
 * 
 * smb environment module
 * 
 */
var os = require('os')
	, env = module.exports = {}; 

var config 	= require('./config');
var protocol = (config.https) ? 'https' : 'http';

env.prefix = process.cwd();
env.serverName = 	config.serverName;

/**
 * 	Get the IPv4 address.
 * I'm not quite sure what would happen if an interface has multiple IPs...
 *
 */
env.getIP = function() {
	// all network interfaces available to the OS
	var interfaces = os.networkInterfaces();
	
	// a list of IPs to remember
	var IPs = [];
	
	// for each interface available...
	for (iface in interfaces) {
		// get all the addresses assigned to this interface
		var addresses = interfaces[iface];
		// for each address assigned to this interface..
		for (address in addresses) {
			// get the properties of this address
		    var IP = addresses[address];
		    // make sure its IPv4 and its not internal
		    if (IP.family == 'IPv4' && !IP.internal) {
		    	// add it to the list of IPs avaialble
		        IPs.push(IP.address);
		    }
		}
	}
//	console.log(IPs);
	
	return IPs[0];
}

//env.url	= 			protocol + '://' + config.host + ':' + config.port;
env.url = 	protocol + '://' + env.getIP() + ':' + config.port;

//console.log('lib/env.js - module.exports');
//console.log(module.exports);


