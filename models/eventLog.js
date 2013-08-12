
module.exports = function(mongoose) {
	var Schema = mongoose.Schema
		, ObjectId = Schema.ObjectId;
		
	return new mongoose.Schema({
		handle: 		{ type: String, 	required: true, unique: true 	}
		, playerID: 	{ type: ObjectId, 	required: true, unique: true 	}
		, time: 		{ type: Date, 		default: new Date() 			}
		, event: 		{ 
			name: 			{ type: String, required: true }
			, arguments: 	{ type: Array, 	required: true }
		}
	});
	
};