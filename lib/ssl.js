
// get required modules
var fs = require('fs')
	, configFile = require('./config');
	
// define the paths to the cert and key files
var certFilePath = configFile.cert || '.ssl/adminion-cert.pem', 
	keyFilePath = configFile.key || '.ssl/adminion-key.pem';

module.exports = {
	//
	// data: Object containing the data buffers of the files,
	// path: Object containing the paths to the files. 
	//
	data : {
		//
		// key: A string or Buffer containing the private key of the server in PEM format. (Required)
		// cert: A string or Buffer containing the certificate key of the server in PEM format. (Required)
		// 
		// @see: http://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener
		//
		cert : fs.readFileSync(certFilePath).toString('ascii'),
		key : fs.readFileSync(keyFilePath).toString('ascii')
	}, 
	path : { 
		cert : certFilePath, 
		key : keyFilePath 
	}
};

// console.log(module.exports)