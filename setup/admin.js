
var root = {
	"email": "adminionionator"
	, "firstName": "adminion"
	, "lastName": "adminion"
	, "handle": "adminion"
};

var passwd = 'adminion';

var config = require('../lib/config')
	debug = require('../lib/debug')();

console.log('Creating new superuser...');

var	db = require('../lib/db')(config.mongodb);

db.once('ready', function() {
	db.createAccount(root, passwd, function(err, account) {
		
		if (err) { 
			console.trace(err); 
			process.exit(); 
		};
		
		console.log('Created new superuser!');
		console.log(account);
		console.log("You should probably change your password from the default ('adminion').");
		
	});
});

db.connect();
