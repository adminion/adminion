
var mongoose = require('mongoose'),
    ChatLogSchema = new mongoose.Schema({
        handle:         { type: String,     required: true }
        , playerID:     { type: mongoose.Schema.Types.ObjectId,   required: true }
        , message:      { type: String,     required: true }
        , time:         { type: Date,       default: new Date()             }
    });

exports.model = mongoose.model('ChatLogEntry', ChatLogSchema)
exports.schema = ChatLogSchema;
