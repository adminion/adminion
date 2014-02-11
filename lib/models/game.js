/** 
 *  models/player.js - define the adminion Game Schema
 * 
 */

var util = require('util');

var Player = require('./player')
    , ChatLog = require('./chatLog')
    , EventLog = require('./eventLog');

var ERR_NO_SEATS            = 'sorry, but all seats are occupied.'
    , MSG_REGISTERED        = 'this user has already.'
    , MSG_IS_PLAYER_ONE     = 'the user is player one.'
    , MSG_PLAYER_AUTHETIC   = 'the player is authentic.'
    , MSG_NOT_PLAYER_ONE    = 'connection is not player one.';

// export the Game constructor
module.exports = function (mongoose) {

    // build player schemas
    var PlayerSchema = Player(mongoose), 
        ChatLogSchema = ChatLog(mongoose), 
        EventLogSchema = EventLog(mongoose),
        GameSchema = new mongoose.Schema({
            playerOne: { 
                accountID: { 
                    type: mongoose.Schema.Types.ObjectId, 
                    required: true 
                },
            
                // handle: {
                //     type: String,
                //     required: true
                // },
            }, 
            
            registeredPlayers:  [ PlayerSchema ],

            // cards:       { 
            //  type: Array,    
            //  default: new Array() 
            // }, 
            // trash:       { type: Array,  default: new Array()    },
            config: { 
                // the number of players allowed to join the game, including player 1
                maxPlayers: { 
                    type:       Number, 
                    default:    4, 
                    min:        2, 
                    max:        8 
                }, 
            
                toWin: { 
                    type:      Number, 
                    default:    4 
                }, 
            
                timeLimit: { 
                    type:       Number, 
                    default:    0 
                } 
            }, 

            status: { 
                type:       String, 
                default:    'lobby' 
            }, 
            
            start: { 
                type:       Date, 
                default:    new Date(), 
                // 24 days = 86,400 seconds  
                expires:    86400 
            }, 
            
            deal: { type: Date }, 
            end: { type: Date },
            
            log: {
                chat:   [ ChatLogSchema ], 
                game:  [ EventLogSchema ]
            }
        });

    GameSchema.method({

        allReady: function () {
            var count = 0;

            // count the players that are ready...
            this.registeredPlayers.forEach(function (player) { 
                // if this player is ready
                if (player.ready) {
                    // add 1 to the count
                    count +=1; 
                }
            });

            // emit the ready event
            if ( count === this.registeredPlayers.length ) {
                return true;
            } else {
                return false;
            }
        },

        openSeats:  function () {

            // the maximum players minus the number occupied seats
            return  this.config.maxPlayers - this.registeredPlayers.length;
        },

        playersConnected: function () {
            var connected = {},
                players = this.registeredPlayers.toObject(),
                index,
                i = 2;

            debug.emit('val', 'this.registeredPlayers', this.registeredPlayers);

            index = this.isRegistered(this.playerOne.accountID);

            // if playerOne is registered
            if ( index !== false ) {
                connected['1'] = players[index];
                players.splice(index,1);
            } else {
                connected['1'] = undefined;
            }

            // debug.emit('val', 'connected[0]', connected[0]);

            

            // fill connected with the rest of them in whatever order the js engine feels is nice
            for ( index in players ) {
                connected[String(i)] = players[index];
                i+=1;
            }

            while (i <= this.config.maxPlayers) {
                connected[String(i)] = undefined;
                i+=1;
            }

            // debug.emit('val', 'connected', connected);

            return connected;   
        },

        /**
         *  GameSchema.isPlayerOne(accountID)
         *
         * determines whether or not the given account is playerOne
         */

        isPlayerOne: function (accountID) {
            // debug.emit('val', 'player', accountID);
            // debug.emit('val', 'playerOne', this.playerOne.accountID);

            if (accountID.toString() === this.playerOne.accountID.toString()) {
                // debug.emit('msg', MSG_IS_PLAYER_ONE);
                return true;
            } else {
                // debug.emit('msg', MSG_NOT_PLAYER_ONE);
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

            // debug.emit('msg', 'game.isRegistered()');
            
            // debug.emit('val', 'this.registeredPlayers', this.registeredPlayers);
            // debug.emit('val', 'accountID', accountID);
            
            if (this.registeredPlayers.length > 0) {
                // debug.emit('msg', 'at least one player registered, searching...');
                for (i = 0; i < this.registeredPlayers.length; i += 1) {
                    debug.emit('val', 'i', i);

                    existingPlayer = this.registeredPlayers[i];

                    // debug.emit('msg', 'index ' + i );
                    // debug.emit('val', 'existingPlayer.accountID', existingPlayer.accountID); 

                    // debug.emit('val', 'new player', accountID);
                    // debug.emit('val', 'registered player ' + i, existingPlayer.accountID);

                    if (accountID.toString() === existingPlayer.accountID.toString() ) {
                        // debug.emit('msg', 'player IS registered.');
                        return i;

                    } else {
                        // debug.emit('msg', 'accountIDs DO NOT match.');
                    }
                };
    
                debug.emit('msg', 'player is NOT registered.');

            } else {
                debug.emit('msg', 'no players registered yet.');
            }

            return false;

        }, 

        startGame: function (callback) {
            debug.emit('msg', 'eventually, startGame() will start the game... for now it just talks about it.');
            // close registration, save the game to the database return true

            if (this.status === 'lobby') {
                
                this.status = 'play';
                this.save(callback);

                return true;

            } else {

                return false; 
            }

        },

        register: function (accountID) {

            // if registration is still open
            if ( this.status === 'lobby') {

                // if the account has already registered with the game
                if ( this.isRegistered(accountID)) {

                    debug.emit('msg', 'the account is already registered.');
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
                            debug.emit('msg', 'openSeats === 1');

                            if (this.isRegistered (this.playerOne.accountID) === false) {
                                debug.emit('msg', 'this.playerOneRegistered === false');

                                if (this.isPlayerOne(accountID) === false) {

                                    // registration is currently full
                                    debug.emit('msg', 'this.isPlayerOne(accountID) === false');

                                    throw("sorry, we're full!");
                                    return false;
                                }                       
                            }
                        }

                        this.registeredPlayers.addToSet({ accountID: accountID });

                        debug.emit('msg', accountID + ' is now registered.');

                        debug.emit('val', 'this.registeredPlayers', this.registeredPlayers);

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

        exitLobby: function (accountID) {

            var index = this.isRegistered(accountID)

            // debug.emit('val', 'index', index);

            // if the index matches the return value of this.isRegistered()...
            if ( index !== false ) {
                this.registeredPlayers[index].remove();

                // debug.emit('val', 'this.registeredPlayers', this.registeredPlayers);

                return true; 

            } else {

                // not sure who to delete, sorry.
                // debug.emit('msg', 'player not found');
                return false;
            }
        }   
    });
    
    // and finally return a model created from GameSchema
    return mongoose.model('Game', GameSchema);
};
