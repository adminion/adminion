
// node core modules
var util = require('util');

// 3rd party modules
var debug = require('debug')('adminion:data:models:game'),
    mongoose = require('mongoose');

var Players = require('./player')
    , ChatLog = require('./chatLog')
    , EventLog = require('./eventLog');

var ERR_NO_SEATS            = 'sorry, but all seats are occupied.'
    , MSG_REGISTERED        = 'this user has already.'
    , MSG_IS_PLAYER_ONE     = 'the user is player one.'
    , MSG_PLAYER_AUTHETIC   = 'the player is authentic.'
    , MSG_NOT_PLAYER_ONE    = 'connection is not player one.';

ObjectId = mongoose.Schema.Types.ObjectId;

var GameSchema = new mongoose.Schema({
    config: {
        host: { type: ObjectId, ref: 'Account', required: true},
        players: { type: Number, min: 2, max: 8, default: 4},
        victory: { type: String, default: 'standard', },
        supply: { 
            action: [ { type: ObjectId, ref: 'Card' } ],
            treasure: {
                copper: { type: Number, default: 60 },
                silver: { type: Number, default: 40 },
                gold: { type: Number, default: 30 }
            },
            victory: { 
                estate: { type: Number, default: 24 },
                duchy: { type: Number, default: 12 },
                province: { type: Number, default: 12 }
            },
            curse: { type: Number, default: 30 }
        },
        deck: {
            copper: { type: Number, default: 7 },
            estate: { type: Number, default: 3 }
        },
        // time limit before auto end-game in seconds
        timeLimit: { type: Number, default: 0 /* 0 = no time limit */ }
    },
    status: { 
        type:       String, 
        default:    'registration' 
    }, 
    log: [EventLog.schema]
});


GameSchema.method({

    allReady: function () {
        var ready = 0;

        // count the players that are ready...
        this.registeredPlayers.forEach(function (player) { 
            // if this player is ready
            if (player.ready) {
                // add 1 to the count
                ready +=1; 
            }
        });

        return (ready === this.registeredPlayers.length ) ? true : false;
        
    },

    exitLobby: function (accountID) {

        var index = this.isRegistered(accountID)

        // debug('index', index);

        // if the index matches the return value of this.isRegistered()...
        if ( index !== false ) {
            this.registeredPlayers[index].remove();

            // debug('this.registeredPlayers', this.registeredPlayers);

            return true; 

        } else {

            // not sure who to delete, sorry.
            // debug('player not found');
            return false;
        }
    },   

    /**
     *  GameSchema.isPlayerOne(accountID)
     *
     * determines whether or not the given account is playerOne
     */

    isPlayerOne: function (accountID) {
        // debug('player', accountID);
        // debug('playerOne', this.playerOne.accountID);

        if (accountID.toString() === this.playerOne._id.toString()) {
            // debug(MSG_IS_PLAYER_ONE);
            return true;
        } else {
            // debug(MSG_NOT_PLAYER_ONE);
            return false;
            
        }
        
    },


    /**
     * GameSchema.isRegistered(accountID)
     *
     * determines whether or not the given player has already entered the lobby
     */
    isRegistered: function (accountID) {

        var i,
            existingPlayer;

        // debug('game.isRegistered()');
        
        // debug('this.registeredPlayers', this.registeredPlayers);
        // debug('accountID', accountID);
        
        if (this.registeredPlayers.length > 0) {
            // debug('at least one player registered, searching...');
            for (i = 0; i < this.registeredPlayers.length; i += 1) {
                // debug('i', i);

                existingPlayer = this.registeredPlayers[i];

                // debug('registered player[' + i + '] ');
                // debug('existingPlayer', existingPlayer); 

                // debug('new player', accountID);
                // debug('registered player ' + i, existingPlayer.account);

                if (accountID.toString() === existingPlayer.account.toString() ) {
                    // debug('player IS registered.');
                    return i;

                } else {
                    // debug('accountIDs DO NOT match.');
                }
            };

            // debug('player is NOT registered.');

        } else {
            // debug('no players registered yet.');
        }

        return false;

    }, 

    openSeats:  function () {

        // the maximum players minus the number occupied seats
        return  this.config.maxPlayers - this.registeredPlayers.length;
    },

    playerReady: function (accountID, value) {
        // get the registration id of the user and update that user
        var player,
            regID = this.isRegistered(accountID);

        player = this.registeredPlayers[regID];

        if (value !== undefined) {
            player.ready = value;
        } 
        
        return player.ready;
        
    },
    

    playersConnected: function () {
        var connected = {},
            players = this.registeredPlayers.toObject(),
            index,
            i = 2;

        // debug('this.registeredPlayers', this.registeredPlayers);

        index = this.isRegistered(this.playerOne['_id']);

        // if playerOne is registered
        if ( index !== false ) {
            connected['1'] = players[index];
            players.splice(index,1);
        } else {
            connected['1'] = undefined;
        }

        // debug('connected[0]', connected[0]);

        

        // fill connected with the rest of them in whatever order the js engine feels is nice
        for ( index in players ) {
            connected[String(i)] = players[index];
            i+=1;
        }

        while (i <= this.config.maxPlayers) {
            connected[String(i)] = undefined;
            i+=1;
        }

        // debug('connected', connected);

        return connected;   
    },

    ready: function () {
        return this.isRegistered(this.playerOne._id) >= 0 && this.registeredPlayers.length > 1 && this.allReady()
    },

    register: function (accountID) {

        // if registration is still open
        if ( this.status === 'lobby') {

            // if the account has already registered with the game
            if ( this.isRegistered(accountID) !== false) {

                // debug('the account is already registered.');
                return 0;

            // but if the account has NOT registered
            } else {

                // get the number of open seats
                openSeats = this.openSeats();

                // if there is still an open seat
                if ( openSeats > 0 ) {

                    // in the event that there's only one seat left AND player one is 
                    // NOT registhered AND this player is not player one..
                    if (openSeats === 1 ) {
                        // debug('openSeats === 1');

                        if (this.isRegistered(this.playerOne) === false) {
                            // debug('this.playerOneRegistered === false');

                            if (this.isPlayerOne(accountID) === false) {

                                // registration is currently full
                                // debug('this.isPlayerOne(accountID) === false');

                                throw("sorry, we're full!");
                                return false;
                            }                       
                        }
                    }

                    this.registeredPlayers.addToSet({ account: accountID });

                    // debug(accountID + ' is now registered.');

                    // debug('this.toObject()', this.toObject());

                    return 1;

                // however, there are no empty seats
                } else {
                    
                    var msg = "sorry, we're full!";

                    // deny them access
                    console.log(msg);

                    throw(msg);
                    return false;
                    
                }

            }

        // but if registration isn't open
        } else {
            var msg = 'sorry, but registration is closed.';
            throw (msg);
            return false;
        }

    },


    startGame: function (callback) {
        // close registration, save the game to the database return true

        if (this.status === 'lobby') {
            
            this.status = 'play';
            this.save(callback);

            return true;

        } else {

            return false; 
        }

    }

});

// and finally return a model created from GameSchema
module.exports = mongoose.model('Game', GameSchema);
