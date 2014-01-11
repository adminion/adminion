/** 
 *  models/player.js - define the adminion Game Schema
 * 
 */

var Player = require('./player')
    , ChatLog = require('./chatLog')
    , EventLog = require('./eventLog');

var ERR_NO_SEATS            = 'sorry, but all seats are occupied.'
    , MSG_REGISTERED        = 'this user has already.'
    , MSG_IS_PLAYER_ONE     = 'the user is player one.'
    , MSG_PLAYER_AUTHETIC   = 'the player is authentic.'
    , MSG_NOT_PLAYER_ONE    = 'connection is not player one.';

// returns that to which an XOR expression would evaluate
function XOR (a,b) {
  return ( a || b ) && !( a && b );
};

// export the Game constructor
module.exports = function (mongoose) {

    // build player schemas
    var PlayerSchema = Player(mongoose)
        , ChatLogSchema = ChatLog(mongoose)
        , EventLogSchema = EventLog(mongoose);

    // define the GameSchema
    var GameSchema = new mongoose.Schema({
        playerOne: { 
            accountID: { 
                type: mongoose.Schema.Types.ObjectId, 
                required: true 
            },
        
            handle: {
                type: String,
                required: true
            },
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
            var connected = {};

            var players = this.registeredPlayers.toObject();

            debug.emit('val', 'this.registeredPlayers', this.registeredPlayers);

            var index = this.isRegistered(this.playerOne.accountID);

            // if playerOne is registered
            if ( index !== false ) {
                connected['1'] = players[index];
                players.splice(index,1);
            } else {
                connected['1'] = undefined;
            }

            // debug.emit('val', 'connected[0]', connected[0]);

            var i = 2;

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
         * determines whether or not the given socket is playerOne
         */

        isPlayerOne: function (accountID) {
            // debug.emit('val', 'player', accountID);
            // debug.emit('val', 'playerOne', this.playerOne.accountID);

            if (accountID.toString() === this.playerOne.accountID.toString()) {
                debug.emit('msg', MSG_IS_PLAYER_ONE);
                return true;
            } else {
                debug.emit('msg', MSG_NOT_PLAYER_ONE);
                return false;
                
            }
            
        },


        /**
         * GameSchema.isRegistered(accountID)
         *
         * determines whether or not the given player has already entered the lobby
         */
        isRegistered: function (accountID) {

            // debug.emit('msg', 'game.isRegistered()');
            
            // debug.emit('val', 'this.registeredPlayers', this.registeredPlayers);
            // debug.emit('val', 'accountID', accountID);
            
            if (this.registeredPlayers.length > 0) {
                // debug.emit('msg', 'at least one player registered, searching...');
                for (var i = 0; i < this.registeredPlayers.length; i += 1) {
                    debug.emit('val', 'i', i);

                    var existingPlayer = this.registeredPlayers[i];

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

        startGame: function () {
            debug.emit('msg', 'eventually, startGame() will start the game... for now it just talks about it.');
            // starting the game includes: 
            //  * set status to inPlay or something
            //  * saving the roster to the database
            //  * instructing sockets to 
        },

        register: function (accountID) {
            
            // debug.emit('val', 'accountID', accountID);
            // debug.emit('val', 'this.registeredPlayers', this.registeredPlayers);

            // define the new player
            this.registeredPlayers.addToSet({ accountID: accountID });

            debug.emit('msg', accountID + ' is now registered.');

            debug.emit('val', 'this.registeredPlayers', this.registeredPlayers);
        
            return this.registeredPlayers.length;
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
