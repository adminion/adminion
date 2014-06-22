
module.exports = function(mongoose) {
	var Schema = mongoose.Schema
		, ObjectId = Schema.ObjectId;
		
	return new mongoose.Schema({
		handle: 		{ type: String, 	required: true		}
		, playerID: 	{ type: ObjectId, 	required: true		}
		, time: 		{ type: Date, 		default: new Date()	}
		, event: 		{ 
			name: 			{ type: String, required: true 		}
			, arguments: 	{ type: Array, 	required: true 		}
		}
	});
	
};