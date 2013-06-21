
// core modules
var events = require('events');

// 3rd party modules
var mongoose = require('mongoose');

// adminion modules
var config = require('./config')
	, Game = require('../models/game')
	, Player = require('../models/player');

// declare db constructor 
function DB() {
	events.EventEmitter.call(this);
	var self = this;
	
	this.connect = function() {
		// connect to database
		mongoose.connect(config.mongodb);
	
		// get an instance of the connection
		this.connection = mongoose.connection;
		
//		debug.emit('var', 'this.connection', this.connection, 'lib/db.js', 25);

		// if the connection has an error, do this: 
		this.connection.on('error', console.error.bind(console, 'connection error:'));
	
		this.connection.once('open', this.onceOpen);
		
	};

	this.onceOpen = function() {
		self.Game = Game(mongoose);
		self.Player = Player(mongoose);
//		debug.emit('var', 'db.Player.schema.methods', db.Player.schema.methods, 'lib/db.js', 34);
		self.emit('ready');
	};
	
};

// Copies all of the EventEmitter properties 
DB.prototype.__proto__ = events.EventEmitter.prototype;

var db = module.exports = new DB();

