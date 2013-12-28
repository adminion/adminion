
var EventEmitter = require('events').EventEmitter;

var voicejs = require('voice.js');

module.exports = function () {

	var sms = Object.create(EventEmitter.prototype);

	sms.init = function (credentials) {

		var client = new voicejs.Client({
		        email: process.argv[2] || 'techjeffharris@gmail.com',
		        password: process.argv[3] || 'Supermd21',
		        tokens: require('./tokens.json')
		});

	};

	sms.send = function (to, text, callback) {

		to = to ? to : ['9712182239'];
		text = text ? text : 'Test GV SMS...';

		// There are two ways to send texts. 
		// ...
		// The second method does NOT return the new conversation id, but allows sending to multiple recipients
		client.altsms({ to: to, text: text}, function(err, res, data){
	        if(err){
	            callback(err, res, data);
	        }
	        
	        console.log('SMS "' +text+ '" sent to:\n', to.join('\n'));

	        callback(err, res, data);

		});
	}

	return sms;

};

