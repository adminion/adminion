/**
 * env.js
 * 
 * smb environment module
 * 
 */
var os = require('os')
	, env = module.exports; 

var config 	= require('./config');
var protocol = (config.https) ? 'https' : 'http';

env.prefix = process.cwd();
env.serverName = 	config.serverName;

/**
 * 	Get the IPv4 address.
 * I'm not quite sure what would happen if an interface has multiple IPs...
 *
 */

var addresses
	, interfaces = os.networkInterfaces()
	, ip
	, ipAddresses = [];

// for each interface available...
for (iface in interfaces) {
	// for each address assigned to this interface..
	for (address in interfaces[iface]) {
		// get the properties of this address
	    ip = interfaces[iface][address];
	    // make sure its IPv4 and its not internal
	    if (ip.family == 'IPv4' && !ip.internal) {
	    	// add it to the list of IPs avaialble
	        ipAddresses.push(ip.address);
	    }
	}
}
//	console.log(IPs);
	
env.url = function() {
	return protocol + '://' + ipAddresses[0] + ':' + config.port;
}

console.log('lib/env.js - module.exports');
//console.log(module.exports);
