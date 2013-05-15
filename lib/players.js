/**
 * define and export adminion 'players' mongodb model module
 * 	say THAT 10 times fast!
 * 
 * the syntax provided by this module should resemble mongodb's
 * 	
 * 
 */

var mongoose = require('mongoose');

var playerSchema = mongoose.Schema({
	firstName: String,
	lastName: String,
	email: String,
	password: String,
	handle: String
});

var Players = module.exports = {};

var Player = Players.Player = mongoose.model('Player', playerSchema);

function onOpen() {
	var jeff = new Player({username: 'elgranjeff', password: 'password'});
	var zane = new Player({username: 'iliketunes', password: 'secret'});
	
	Player.save(jeff);
	
}

var db = mongoose.createConnection();

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', onOpen);
