
var config = require('./config')
	, fs = require('fs');
	
var ssl = module.exports = {
	cert : fs.readFileSync(config.https.cert).toString('ascii'),
	key : fs.readFileSync(config.https.key).toString('ascii')
};

console.log('lib/ssl.js ssl', ssl);
