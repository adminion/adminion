
var root = {
	"email": "adminion"
	, "firstName": "adminion"
	, "lastName": "adminion"
	, "handle": "adminion"
};

var passwd = 'adminion';

var config = require('../lib/config')
	, mongoose = require('mongoose')
	, Player = require('../models/player')(mongoose);

mongoose.connect(config.mongodb);
var mongo = mongoose.connection;

// if the connection encounters an error
mongo.on('error', function(err) { 
	console.trace(err); 
	process.exit(-1) 
});

mongo.once('open', function() {
	Player.register(root, passwd, function(err, player) {
		if (err) { console.trace(err); process.exit(-1); };
		console.log('created superuser "adminion" with password "adminion"');
		process.exit();
	});
});

