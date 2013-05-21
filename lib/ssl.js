
var fs = require('fs')
	, configFile = require('../config');
	
var prefix = '/home/jeff/.ssl';

var cert = prefix + (configFile.cert || "/adminion-cert.pem")
	, key = prefix + (configFile.key 	|| "/adminion-key.pem");
	
var ssl = module.exports = 
{
	cert : fs.readFileSync(cert) /* .toString('ascii') */ 
	, key : fs.readFileSync(key) /* .toString('ascii') */
	, 
}

//{ 
//	ca: prefix + (configFile.ca 		|| "/root.cer")
//	, cert: prefix + (configFile.cert 	|| "/adminion-cert.pem")
//	, key: prefix + (configFile.key 	|| "/adminion-key.pem")
//	, requestCert : configFile.requestCert || true
//	, rejecdtUnauthorized : configFile.rejectUnauthorized || true 
//} 

	;

console.log('lib/ssl.js ssl', ssl);
