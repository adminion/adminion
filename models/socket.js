
module.exports = function(mongoose) {
	var Schema = mongoose.Schema
		, ObjectId = Schema.ObjectId;

	var SocketSchema = new mongoose.Schema({
		game: 		{ type: ObjectId, 	required: true }
		, player: 	{ type: ObjectId, 	required: true }
		, socket: 	{ type: Object, 	required: true }
	});

	

	return SocketSchema;
};