/** 
 * 	models/player.js - define the adminion Game Schema
 * 
 */

var ERR_PARTIAL_MATCH		= 'the connetion partially matches another connection.'
	, ERR_INVALID_SESSION	= 'bad combination of playerID and sessionID'
	, ERR_NOT_UNIQUE 		= 'the connection is not unique.'
	, ERR_NOT_AUTHENTIC		= 'the player is not authentic.'
	, ERR_NO_SEATS 			= 'sorry, but all seats are occupied.'
	, ERR_NO_PLAYER_ONE 	= 'roster is full, but no player one...'
	, ERR_UNKNOWN_SOCKET	= 'unknown socket.'

	, MSG_DUPLICATE 		= 'the connection is a duplicate of an existing user connection.'
	, MSG_IS_PLAYER_ONE		= 'connection is player one.'
	, MSG_PLAYER_AUTHETIC	= 'the player is authentic.'
	, MSG_NOT_PLAYER_ONE	= 'connection is not player one.'
	, MSG_UNIQUE			= 'the connection is unique.';

// returns that to which an XOR expression would evaluate
function XOR(a,b) {
  return ( a || b ) && !( a && b );
};

// export the Game constructor
module.exports = function(mongoose) {

	var Schema = mongoose.Schema
		, ObjectId = Schema.ObjectId;

	var PlayerSchema = new Schema({
		handle: 		{ type: String, 	required: 	true, unique: true 	}
		, seat: 		{ type: Number, 	required: 	true, unique: true  }
		, playerID: 	{ type: ObjectId, 	required: 	true, unique: true 	}
		, sessionID: 	{ type: String, 	required: 	true, unique: true 	}
		, ready: 		{ type: Boolean, 	default: 	false 				}
	});

	var ChatLogSchema = new mongoose.Schema({
		handle: 		{ type: String, 	required: true, unique: true 	}
		, playerID: 	{ type: ObjectId, 	required: true, unique: true 	}
		, time: 		{ type: Date, 		default: new Date() 			}
		, message: 		{ type: String, 	required: true					}
	});

	var EventLogSchema = new mongoose.Schema({
		handle: 		{ type: String, 	required: true, unique: true 	}
		, playerID: 	{ type: ObjectId, 	required: true, unique: true 	}
		, time: 		{ type: Date, 		default: new Date() 			}
		, event: 		{ 
			name: 			{ type: String, required: true }
			, arguments: 	{ type: Array, 	required: true }
		}
	});

	// define the GameSchema
	var GameSchema = new mongoose.Schema({
		name: 			{ type: String, required: true, unique: true }
		, playerOne: 	{ type: Object, default: PlayerSchema }
		, players: 		[ PlayerSchema ]
		// , cards: 		{ type: Array, 	default: new Array() 	}
		// , trash: 		{ type: Array, 	default: new Array() 	}
		, config: 		{ 
			// the number of players that may join the game, including player 1
			maxPlayers: 	{ type: Number, default: 4, min: 2, max: 8 }
			, toWin: 		{ type: Number, default: 4 }
			, timeLimit: 	{ type: Number, default: 0 }
		}
		, status: 		{ type: String, default: 'lobby' }
		, log: 			{
			chat: 	 		[ ChatLogSchema ]
			, event: 		[ EventLogSchema ]
			, start: 		{ type: Date, 	default: new Date() 	}
			, deal: 		{ type: Date }
			, end: 			{ type: Date }
		}
	});

	GameSchema.method({
		/**
		 * 	GameSchema.numPlayers(countP1)
		 * 
		 * calculates and returns the number of players connected
		 *
		 * by default player one is not counted
		 */
		occupiedSeats: function(countPlayerOne) {
			var seats = 0; 

			// debug.val('this.players', this.players, 'models/game.js', 84);
			// debug.val('this.players.length', this.players.length, 'models/game.js', 85);

			// go through all enabled seats
			for (var p = (!!countPlayerOne) ? 0 : 1; p < this.config.maxPlayers; p +=1) {
				if (!!this.players[p]) {
					// increment total
					seats += 1;
				}
			};

			// debug.val('seats', seats, 'models/game.js', 95);
			return seats;
		},

		numSeats: function() {
			// max players includes player one, but player one always has a seat
			// so player one isn't relevant when calculating the number of "seats"
			return this.config.maxPlayers -1;
		}, 

		/**
		 * 	GameSchema.openSeats()
		 * 
		 * returns the number of seats available not counting player one
		 */
		openSeats: function() {

			return  this.numSeats() - this.occupiedSeats();
		},

		/**
		 * GameSchema.playerExists(playerID)
		 *
		 * determines whether or not the given player has already entered the lobby
		 */
		playerExists: function(playerID, sessionID) {
			
			debug.val('this.players', this.players, 'models/game.js', 126);
			debug.val('playerID', playerID, 'models/game.js', 127);
			debug.val('sessionID', sessionID, 'models/game.js', 128);

			match = -1

			eachPlayer:
			this.players.forEach(function(player, seat) {
				debug.msg('player ' + seat , 'models/game.js', 131);
				debug.val('player', player, 'models/game.js', 132);	

				debug.val('new vs existing player comparison', [playerID
					, ''+player.playerID
					, sessionID
					, player.sessionID], 'models/game.js', 136);

				if (playerID === ''+player.playerID ) {
					var playerMatch = true;
					debug.msg('playerIDs match!', 'models/game.js', 143);
				} else {
					debug.msg('playerIDs DO NOT match!', 'models/game.js', 145);
				}

				if (sessionID === player.sessionID) {
					var sessionMatch = true;
					debug.msg('sessionIDs match!', 'models/game.js', 150);	
				} else {
					debug.msg('sessionIDs DO NOT match!', 'models/game.js', 152);	
				}

				if (playerMatch && sessionMatch ) {

					match = seat;
				}

				
			});

			return match;
		}, 

		/**
		 *	GameSchema.invalid(playerID, sessionID) 
		 *
		 * determines whether or not the given ID pairs is invalid
		 */
		invalid: function(playerID, sessionID) {
			this.players.forEach(function(player, seat) {
				if (XOR(playerID === player.playerID, sessionID === player.sessionID)) {
					return true;
				}
			});

			return false;
		},

		/**
		 *	GameSchema.isPlayerOne(playerID, sessionID)
		 *
		 * Determines whether or not the given player is PlayerOne
		 */
		isPlayerOne: function(playerID, sessionID) {

			debug.val('player vs playerOne', [playerID
				, ''+this.playerOne.playerID
				, sessionID
				, this.playerOne.sessionID], 'models/game.js', 173);

			if (playerID === ''+this.playerOne.playerID) {
				if (sessionID === this.playerOne.sessionID) {
					debug.msg(MSG_IS_PLAYER_ONE, 'models/game.js', 177);
					return true;
				} 
			} 
			
			debug.msg(MSG_NOT_PLAYER_ONE, 'models/game.js', 182);
			return false
		},

		/**
		 *	GameSchema.isplayerOneConnected()
		 *
		 * determines whether or not player one is connected
		 */
		isplayerOneConnected: function() {
			this.players.forEach(function(player) {
				if (player.seat === 0) {
					return true;
				}
			});

			return false;
		}, 

		/**
		 *	GameSchema.allReady()
		 *
		 * determines whether or not all players are ready
		 */
		allReady: function() {
			var count = 0
				, seats = this.occupiedSeats(true);

			// count the players that are ready
			this.players.forEach(function(player) { 
				// if this player is ready
				if (player.ready) {
					// add 1 to the count
					count +=1; 
				}
			});

			// emit the ready event
			if ( count === seats ) {
				return true;
			} else {
				return false;
			}
		},

		/**
		 *	GameSchema.nextSeat()
		 *
		 * determines the number of the next open seat
		 */
		nextSeat: function() {
			for (var seat = 1; seat < this.config.maxPlayers; seat += 1) {
				if (!this.players[seat]) {
					return seat;
				}
			}
			return false;
		},

		seatOf: function(socketID) {
			return this.playerExists(socketID);

		},

		startGame: function() {

		},

		enterLobby: function(socket) {
			var handle = 		socket.handshake.user.handle
				, playerID = 	socket.handshake.user['_id'].toString()
				, sessionID = 	socket.handshake.sessionID
				, seats = 		this.openSeats()

			debug.val('playerID', playerID, 'models/game.js', 222);
			debug.val('sessionID', sessionID, 'models/game.js', 223);
			debug.val('this.playerOne', this.playerOne, 'models/game.js', 224);
			debug.val('this.players', this.players, 'models/game.js', 225);
			debug.val('seats', seats, 'models/game.js', 226);

			////////////////////////////////////////////////////////////////////
			//
			// connection screening algorithm
			//
			////////////////////////////////////////////////////////////////////

			// if the player is player one, we'll check them out first
			if (this.isPlayerOne(playerID, sessionID)) {
				// if playerOne isn't already connected
				if (!this.isplayerOneConnected()) {
					// add player one to the list of connected players

					this.players.push({ 
						handle: handle
						, seat: 0
						, playerID: playerID
						, sessionID: sessionID
					});

					// once player one clicks "start!" we actually start the game!
					socket.once('start!', function onStart() {						
						if (this.allReady()) {

							// the configuration will be updated as player one makes changes

							this.status = "play";
							this.log.deal = new Date();
							

							this.emit('startGame!', true);
						}
					});
				}

				// return 0 for player 1
				return 0;

			// if not player one, make sure this player doesn't have playerOne's sessionID
			} else if (sessionID === this.playerOne.sessionID) {
				debug.msg('denied: ' + ERR_INVALID_SESSION, 'models/game.js', 266);
				return false;
			}
			
			// if there are no empty seats
			if (!seats) {
				debug.msg('denied: ' + ERR_NO_SEATS, 'models/game.js', 272);
				return false;

			// if there is at least one open seat
			} else {
				
				// check to see if this player has connected during this session
				var seat = this.playerExists(playerID, sessionID);
				debug.val('seat', seat, 'models/game.js', 278);

				// if playerOne
				if (seat === 1) {
					debug.msg('denied: ' + ERR_INVALID_SESSION, 'models/game.js', 283);
					return false;
				// if player does not match any other player exactly
				} else if (seat === -1) {
					// if the player partially matches an existing player?
					if (this.invalid(playerID, sessionID)) {
						debug.msg('denied: ' + ERR_INVALID_SESSION, 'models/game.js', 310);
						return false;
					}
				} else {
					return seat;
				}


				//this player has connected
			}

			////////////////////////////////////////////////////////////////////
			//
			// we're good to connect if we've made it this far!
			//
			////////////////////////////////////////////////////////////////////

			// calculate the lowest open seat number
			var seat = this.nextSeat();

			debug.val('seat', seat, 'models/game.js', 322);

			// define the new player
			this.players.addToSet({
				handle: handle,
				seat: seat,
				playerID: playerID,
				sessionID: sessionID
			});
		
			return seat;
		},

		exitLobby: function(handshake) {

			var handle = 		handshake.user.handle
				, playerID = 	handshake.user['_id'].toString()
				, sessionID = 	handshake.sessionID

			debug.val('seat', seat, 'models/game.js', 345);

			// has the player connected?
			var seat = this.playerExists(playerID, sessionID);
			
			debug.val('seat', seat, 'models/game.js', 350);
			
			// if the seat matches the return value of this.sessionExists()...
			if ( seat !== -1) {
				// we have a valid user, delete them!
				this.players[seat].remove();

				debug.val('this.players', this.players, 'models/game.js', 341);

				debug.msg(handle + ' has left seat ' + seat + '.', 'models/game.js', 343);
				return true; 

			} else {

				// not sure who this person wants to delete, sorry.
				debug.msg('player not found', 'models/game.js', 350);
				return false;
			}
		}	
	});
	
	// and finally return a model created from GameSchema
	return mongoose.model('Game', GameSchema);
};
