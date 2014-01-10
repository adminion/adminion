
module.exports = function(mongoose) {
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var PlayerSchema = new mongoose.Schema({
        accountID:  { type: ObjectId,   required: true }
        , ready:    { type: Boolean,    default: false } 
        , dominion:     [ ObjectId ]
        , hand:         [ ObjectId ]
        , inPlay:       [ ObjectId ]
        , discard:      [ ObjectId ]
        , trash:        [ ObjectId ]
    });

    return PlayerSchema;
};