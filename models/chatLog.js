
module.exports = function(mongoose) {
	var Schema = mongoose.Schema
		, ObjectId = Schema.ObjectId;

	return new mongoose.Schema({
		handle: 		{ type: String, 	required: true, unique: true 	}
		, playerID: 	{ type: ObjectId, 	required: true, unique: true 	}
		, message: 		{ type: String, 	required: true, unique: false	}
		, time: 		{ type: Date, 		default: new Date() 			}
	});
};