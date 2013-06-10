/** 
 * 	models/player.js - define the adminion Game Schema
 * 
 */

// export the Game constructor
module.exports = function(mongoose) {

	// define the GameSchema
	var GameSchema = new mongoose.Schema({
		players: Array
		, cards: Array
		, trash: Array
		, config: {
			toWin: {type: Number, default: 3}
			, timeLimit : {type: Number, default: 0}
		}
		, log: {
			chat: Array
			, game: Array
			, start : Date
			, deal : Date
			, end : Date
		}
	});
	
	// and finally return a model created from GameSchema
	return mongoose.model('Game', GameSchema);
};
