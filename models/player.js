/**
 * define the object structure of the Player Schema
 * 
 */

var mongoose = require('mongoose')
	, Schema = mongoose.Schema
	, passportLocalMongoose = require('passport-local-mongoose')

var PlayerSchema = new Schema({
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

// now plugin the passportLocalMongoose functionality
PlayerSchema.plugin(passportLocalMongoose);

// and finally create a model from our PlayerSchema
module.exports = mongoose.model('Player', PlayerSchema);

