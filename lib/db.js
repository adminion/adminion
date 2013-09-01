
// core node modules
var events = require('events');

// Adminion modules
var Game = require('../models/game')
	, Account = require('../models/account');

// 3rd party modules
var mongoose = require('mongoose')
	, passport = require('passport');

// export the db factory function which is passed adminion
module.exports = function (adminion) {

	// the module itself
	db = Object.create(events.EventEmitter.prototype);

	// create an instance of the connection
	mongoose.connect(adminion.config.mongodb);

	db.connection = mongoose.connection;

	// debug.val('db.connection', db.connection, 'lib/db.js', 27);

	// if the connection has an error, do this: 
	db.connection.on('error', console.error.bind(console, 'connection error:'));

	// once the connection is open
	db.connection.once('open', function () {
		// compile Game and Account models
		db.games = Game(mongoose);
		db.accounts = Account(mongoose);

		db.passport = passport;

		// createStrategy() returns the pre-built strategy
		db.passport.use(db.accounts.createStrategy());
		// serializeUser() and deserializeUser() return the functions passport will use
		db.passport.serializeUser(db.accounts.serializeUser());
		db.passport.deserializeUser(db.accounts.deserializeUser());

		// debug.val('db.accounts', db.accounts, 'lib/db.js', 41);
		// debug.val('db.games', db.games, 'lib/db.js', 42);

		db.emit('ready');
	});

	return db;

};

