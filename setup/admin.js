
var root = {
	"email": "adminion"
	, "firstName": "adminion"
	, "lastName": "adminion"
	, "handle": "adminion"
};

var passwd = 'adminion';

var config = require('../lib/config')
	debug = require('../lib/debug')();

console.log('Creating new superuser...');

var tools = { 
	config: { 
		mongodb: config.mongodb 
	} 
};

var dbConstructor = require('../lib/db'),
	db = new dbConstructor(tools);

db.once('ready', function() {
	db.createAccount(root, passwd, function(err, account) {
		
		if (err) { 

			if (err.message === 'User already exists with name adminionionator') {
				console.log('Superuser already exists, skipping.');
				process.exit();
			}
			
			console.trace(err); 
			process.exit(); 
		};
		
		console.log('Created new superuser!');
		console.log(account);
		console.log("You should probably change your password from the default ('adminion').");

		process.exit();
		
	});
});

db.start();
