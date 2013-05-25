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
	email: {type: String, unique : true},
	password: String,
	handle: {type: String, unique : true},
	stats: {
		created : Date,
		gamesPlayed: Number,
		gamesWon: Number,
		mostPoints: Number,
		totalPoints: Number,
		totalPlayTime: Number
	}
});

var Player = module.exports = mongoose.model('Player', playerSchema);


