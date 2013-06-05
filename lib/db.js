
// core modules
var events = require('events');

// 3rd party modules
var mongoose = require('mongoose');

// adminion modules
var config = require('./config')
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

		// if the connection has an error, do this: 
		this.connection.on('error', console.error.bind(console, 'connection error:'));
	
		this.connection.once('open', this.onceOpen);
		
	};

	this.onceOpen = function() {
		self.Player = Player(mongoose);
		console.log('lib/db.js - db.Player');
		console.log(db.Player.schema.methods);
		self.emit('ready');
	};
	
};

// Copies all of the EventEmitter properties 
DB.prototype.__proto__ = events.EventEmitter.prototype;

var db = module.exports = new DB();

