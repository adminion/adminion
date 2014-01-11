/** 
 * 	models/account.js - define the adminion Account Schema
 * 
 * @see https://github.com/saintedlama/passport-local-mongoose
 */

var passportLocalMongoose = require('passport-local-mongoose');

// export the Account constructor
module.exports = function (mongoose) {
	
	// define the AccountSchema
	// username, password, etc are added by passportLocalMongoose plugin
	var AccountSchema = new mongoose.Schema({
		admin: 		{ type: Boolean, 	default: 	false }, 
		email:		{ type: String, 	lowercase: 	true, 		trim: true		}, 
		handle: 	{ type: String, 	required: 	true, 		unique : true	},
		firstName: 	{ type: String, 	required: 	true, 		trim: true		}, 
		lastName: 	{ type: String, 	required: 	true,		trim: true		}, 
		cards: 		{ type: Array, 		default: 	new Array() 				}, 
		accountStats: {
			created : 		{ type: Date, 	default: new Date() }, 
			gamesPlayed: 	{ type: Number, default: 0 			}, 
			gamesWon: 		{ type: Number, default: 0 			}, 
			mostPoints: 	{ type: Number, default: 0 			}, 
			totalPoints: 	{ type: Number, default: 0 			},
			totalPlayTime: 	{ type: Number, default: 0 			}
		}
		
	});
	
	// now plugin the passportLocalMongoose functionality
	AccountSchema.plugin(passportLocalMongoose, { 
		usernameField : 'email' 
		, usernameLowerCase: true
	});
	
	// and finally return a model created from AccountSchema
	return mongoose.model('Account', AccountSchema);
};
