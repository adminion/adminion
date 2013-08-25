
// core node modules
var events = require('events');

// Adminion modules
var Game = require('../models/game')
	, Account = require('../models/account');

// 3rd party modules
var mongoose = require('mongoose');

// export the constructor 
module.exports = function (onReady) {

	// create a new object from scratch
	db = Object.create(events.EventEmitter.prototype);

	db.connection = mongoose.connect(Adminion.config.mongodb);
	
	debug.emit('var', 'db.connection', db.connection, 'lib/db.js', 27);

	// if the connection has an error, do this: 
	db.connection.on('error', console.error.bind(console, 'connection error:'));

	// once the connection is open
	db.connection.once('open', function (){
		// compile Game and Account models
		db.Games = Game(mongoose);
		db.Accounts = Account(mongoose);

		// debug.val('db.Accounts', db.Accounts, 'lib/db.js', 34);

		db.emit('ready');
	});

	return db;

};
