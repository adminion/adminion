
<<<<<<< HEAD
// core node modules
=======
>>>>>>> temp_rewind
var events = require('events');

// Adminion modules
var Game = require('../models/game')
	, Account = require('../models/account');

// 3rd party modules
var mongoose = require('mongoose');

<<<<<<< HEAD
// export the constructor 
module.exports = function Db (Adminion) {

	// create a new object from scratch
	Adminion.db = Object.create(events.EventEmitter.prototype);

	Adminion.db.connection = mongoose.connect(Adminion.config.mongodb);
	
	debug.val('Adminion.db.connection', Adminion.db.connection, 'lib/db.js', 27);

	// if the connection has an error, do this: 
	Adminion.db.connection.on('error', console.error.bind(console, 'connection error:'));

	// once the connection is open
	Adminion.db.connection.once('open', function (){
		// compile Game and Account models
		Adminion.db.Games = Game(mongoose);
		Adminion.db.Accounts = Account(mongoose);

		// debug.val('Adminion.db.Accounts', Adminion.db.Accounts, 'lib/Adminion.db.js', 34);

		Adminion.db.emit('ready');
	});
=======
// export the db factory function which is passed adminion
module.exports = function (adminion) {

	// the module itself
	db = Object.create(events.EventEmitter.prototype);

	// create an instance of the connection
	db.connection = mongoose.createConnection(adminion.config.mongodb);;
	
	debug.emit('var', 'db.connection', db.connection, 'lib/db.js', 27);

	// if the connection has an error, do this: 
	db.connection.on('error', console.error.bind(console, 'connection error:'));

	// once the connection is open
	db.connection.once('open', function (){
		// compile Game and Account models
		db.Games = Game(mongoose);
		db.Accounts = Account(mongoose);

		db.passport = require('passport');

		// createStrategy() returns the pre-built strategy
		db.passport.use(db.Accounts.createStrategy());
		// serializeUser() and deserializeUser() return the functions passport will use
		db.passport.serializeUser(db.Accounts.serializeUser());
		db.passport.deserializeUser(db.Accounts.deserializeUser());

		// debug.val('db.Accounts', db.Accounts, 'lib/db.js', 34);

		db.emit('ready');
	});

	return db;
>>>>>>> temp_rewind

};

