
module.exports = function(mongoose) {
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var PlayerSchema = new mongoose.Schema({
        account:  { type: ObjectId,   ref: 'Account' },
        ready:    { type: Boolean,    default: false },
        dominion:     [ { type: ObjectId, ref: 'Card' } ],
        hand:         [ { type: ObjectId, ref: 'Card' } ],
        inPlay:       [ { type: ObjectId, ref: 'Card' } ],
        discard:      [ { type: ObjectId, ref: 'Card' } ]
    });

    return PlayerSchema;
};