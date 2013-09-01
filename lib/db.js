
// core node modules
var events = require('events');

// Adminion modules
var Game = require('../models/game')
	, Account = require('../models/account');

// 3rd party modules
var mongoose = require('mongoose');

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

};

