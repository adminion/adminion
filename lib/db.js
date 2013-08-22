
// Adminion modules
var Game = require('../models/game')
	, Account = require('../models/account');

// 3rd party modules
var mongoose = require('mongoose');

// local pointer to main Adminion instance
var Adminion; 

// declare db constructor 
function DB() {
	var self = this;

	this.init = function (onReady) {
		// connect to database
		mongoose.connect(Adminion.config.mongodb);
	
		// get an instance of the connection
		this.connection = mongoose.connection;
		
		debug.emit('var', 'this.connection', this.connection, 'lib/db.js', 27);

		// if the connection has an error, do this: 
		this.connection.on('error', console.error.bind(console, 'connection error:'));
	
		// once the connection is open
		this.connection.once('open', function (){
			// compile Game and Account models
			self.Games = Game(mongoose);
			self.Accounts = Account(mongoose);

			// debug.val('self.Accounts', self.Accounts, 'lib/db.js', 34);

			// call the 
			onReady(self);
		});
	};	
};

// export the constructor 
module.exports = function (adminion, onReady) {

	Adminion = adminion;
	Adminion.db = new DB();

	Adminion.db.init(onReady);
};
