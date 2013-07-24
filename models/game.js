/** 
 * 	models/player.js - define the adminion Game Schema
 * 
 */

// export the Game constructor
module.exports = function(mongoose) {

	// define the GameSchema
	var GameSchema = new mongoose.Schema({
		name : { type: String, required: true, unique: true }
		, playerOne : { 
			type: Object, 
			required: true, 
			unique: true, 
			default : {
				playerID : { type: String, required: true, unique: true},
				sessionID : { type: String, required: false, unique: true}
			}
		}
		, players : Array
		, cards: 		{ type: Array, default: new Array() }
		, trash: 		{ type: Array, default: new Array() }
		, config: { 
			maxPlayers: 	{ type: Number, default: 4 }
			, toWin: 		{ type: Number, default: 3 }
			, timeLimit: 	{ type: Number, default: 0 }
		}
		, status: { type: String, default: 'lobby' }
		, log: {
			chat: 		{ type: Array, default: new Array() }
			, game: 	{ type: Array, default: new Array() }
			, start: 	{ type: Date, default: new Date() }
			, deal: 	Date
			, end: 		Date
		}
	});
	
	// and finally return a model created from GameSchema
	return mongoose.model('Game', GameSchema);
};
