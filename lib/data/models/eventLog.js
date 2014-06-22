
var autoIncrement = require('mongoose-auto-increment'),
	mongoose = require('mongoose');

autoIncrement.initialize(mongoose.connection);
	
var EventLogSchema = new mongoose.Schema({	 
    _id: Number,
    turn: { type: Number, required: true },
    name: { type: String, required: true },
    message: { type: String, required: true },
    changes: { type: mongoose.Schema.Types.Mixed }
});

EventLogSchema.plugin(autoIncrement.plugin, 'EventLogEntry');
	
exports.model = mongoose.model('EventLogEntry', EventLogSchema);
exports.schema = EventLogSchema;
