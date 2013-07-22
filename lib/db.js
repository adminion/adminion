
// core modules
var events = require('events');

// 3rd party modules
var mongoose = require('mongoose');

// adminion modules
var config = require('./config')
	, Game = require('../models/game')
	, Person = require('../models/person');

var db;

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
	
		this.connection.once('open', function(){
			self.Game = Game(mongoose);
			self.Person = Person(mongoose);
			//		debug.emit('var', 'db.Person.schema.methods', db.Person.schema.methods, 'lib/db.js', 34);
			self.emit('ready');
		});
		
	};	
};

// Copies all of the EventEmitter properties 
DB.prototype.__proto__ = events.EventEmitter.prototype;

db = new DB();

module.exports = db;