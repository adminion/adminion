/** 
 * 	models/person.js - define the adminion Person Schema
 * 
 * @see https://github.com/saintedlama/passport-local-mongoose
 */

var passportLocalMongoose = require('passport-local-mongoose');

// export the Person constructor
module.exports = function (mongoose) {
	
	// define the PersonSchema
	// username, password, etc are added by passportLocalMongoose plugin
	var PersonSchema = new mongoose.Schema({
		admin: 			{ type: Boolean, 	default: 	false 						}
		, firstName: 	{ type: String, 	required: 	true 						}
		, lastName: 	{ type: String, 	required: 	true 						}
		, handle: 		{ type: String, 	required: 	true, 		unique : true	}
		, cards: 		{ type: Array, 		default: 	new Array() 				}
		, playerStats: {
			created : 			{ type: Date, 	default: new Date() }
			, gamesPlayed: 		{ type: Number, default: 0 }
			, gamesWon: 		{ type: Number, default: 0 }
			, mostPoints: 		{ type: Number, default: 0 }
			, totalPoints: 		{ type: Number, default: 0 }
			, totalPlayTime: 	{ type: Number, default: 0 }
		}
	});
	
	// now plugin the passportLocalMongoose functionality
	PersonSchema.plugin(passportLocalMongoose, { usernameField : 'email' });
	
	// and finally return a model created from PersonSchema
	return mongoose.model('Person', PersonSchema);
};
