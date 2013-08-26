
// core node modules
var events = require('events');

// Adminion modules
var Game = require('../models/game')
	, Account = require('../models/account');

// 3rd party modules
var mongoose = require('mongoose');

// export the constructor 
module.exports = function Db (Adminion) {

	// create a new object from scratch
	Adminion.db = Object.create(events.EventEmitter.prototype);

	Adminion.db.connection = mongoose.connect(Adminion.config.mongodb);
	
	debug.emit('var', 'Adminion.db.connection', Adminion.db.connection, 'lib/Adminion.db.js', 27);

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

};
