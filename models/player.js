/** 
 * 	models/player.js - define the adminion Player Schema
 * 
 * @see https://github.com/saintedlama/passport-local-mongoose
 */

var passportLocalMongoose = require('passport-local-mongoose');

// export the Player constructor
module.exports = function(mongoose) {
	var self = this;
	
	// define the PlayerSchema
	var PlayerSchema = new mongoose.Schema({
		firstName: String,
		lastName: String,
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
	PlayerSchema.plugin(passportLocalMongoose
		, { usernameField : 'email' }
	);

	// and finally return a model created from PlayerSchema
	return mongoose.model('Player', PlayerSchema);
};
