/** 
 * 	models/player.js - define the adminion Game Schema
 * 
 */

var ERR_PARTIAL_MATCH		= 'the connetion partially matches another connection.'
	, ERR_INVALID_SESSION	= 'bad combination of playerID and sessionID'
	, ERR_NOT_UNIQUE 		= 'the connection is not unique.'
	, ERR_NOT_AUTHENTIC		= 'the player is not authentic.'
	, ERR_NO_SEATS 			= 'sorry, but all seats are occupied.'
	, ERR_NO_PLAYER_ONE 	= 'game is full, but no player one...'
	, ERR_UNKNOWN_SOCKET	= 'unknown socket.'

	, MSG_DUPLICATE 		= 'the connection is a duplicate of an existing user connection.'
	, MSG_IS_PLAYER_ONE		= 'connection is player one.'
	, MSG_PLAYER_AUTHETIC	= 'the player is authentic.'
	, MSG_NOT_PLAYER_ONE	= 'connection is not player one.'
	, MSG_UNIQUE			= 'the connection is unique.';

// returns that to which an XOR expression would evaluate
function XOR (a,b) {
  return ( a || b ) && !( a && b );
};

// export the Game constructor
module.exports = function (mongoose) {

	// get the required schemas
	var PlayerSchema = require('./player')(mongoose)
		, ChatLogSchema = require('./chatLog')(mongoose)
		, EventLogSchema = require('./eventLog')(mongoose);

	// define the GameSchema
	var GameSchema = new mongoose.Schema({
		playerOne: 	{ 
			accountID : { 
				type: mongoose.Schema.Types.ObjectId, 
				required: true 
			}
		}
		, registeredPlayers: 	[ PlayerSchema ]
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

	GameSchema.virtual('allReady'.get(function () {
		var count = 0
			, seats = this.occupiedSeats(true);

		// count the players that are ready
		this.registeredPlayers.forEach(function (player) { 
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
	});

	GameSchema.virtual('nextSeat').get(function () {
		for (var seat = 1; seat < this.config.maxPlayers; seat += 1) {
			if (!this.registeredPlayers[seat]) {
				return seat;
			}
		}
		return false;
	});

	GameSchema.virtual('openSeats').get(function () {

		return  this.config.maxPlayers - this.occupiedSeats();
	});

	GameSchema.virtual('registration').get(function () {

		// if open seats is between one and the maximum, return true; else return false
		return ( 0 < this.openSeats && this.openSeats <= this.config.maxPlayers) ? true : false;
	});

	GameSchema.virtual('playerOneRegistered').get(function () {

		// if player 0 is registered, 
		return (this.registeredPlayers[0]) ? true : false;
	});

	GameSchema.virtual('roster').get(function () {
		var roster = [];

		// fill the roster players who's keys are their seat numbers
		this.registeredPlayers.forEach(function (player, seat) {
			roster[ seat ] = player.handle;
		});

		debug.val('players', players, 'models/game.js', 114);

		return players;
		
	});

	GameSchema.method({
		/**
		 *	GameSchema.isPlayerOne(us)
		 *
		 * determines whether or not the given socket is playerOne
		 */

		isPlayerOne: function (playerID) {
			debug.val('player vs playerOne', [playerID
				, ''+this.playerOne.playerID
				, sessionID
				, this.playerOne.sessionID], 'models/game.js', 209);

			if (playerID === ''+this.playerOne.playerID) {
				if (sessionID === this.playerOne.sessionID) {
					debug.msg(MSG_IS_PLAYER_ONE, 'models/game.js', 213);
					return true;
				} 
			} 
			
			debug.msg(MSG_NOT_PLAYER_ONE, 'models/game.js', 218);
			return false;
		},


		/**
		 * GameSchema.isRegistered(accountID)
		 *
		 * determines whether or not the given player has already entered the lobby
		 */
		isRegistered: function (accountID) {
			
			debug.val('this.registeredPlayers', this.registeredPlayers, 'models/game.js', 143);
			debug.val('playerID', playerID, 'models/game.js', 144);
			
			match = -1

			eachPlayer:
			this.registeredPlayers.forEach(function (player, seat) {
				debug.msg('player ' + seat , 'models/game.js', 151);
				debug.val('player', player, 'models/game.js', 152);	

				debug.val('new vs existing player comparison', [playerID
					, ''+player.playerID
					, sessionID
					, player.sessionID], 'models/game.js', 157);

				if (playerID === ''+player.playerID ) {
					var playerMatch = true;
					debug.msg('playerIDs match!', 'models/game.js', 161);
				} else {
					debug.msg('playerIDs DO NOT match!', 'models/game.js', 163);
				}

				if (sessionID === player.sessionID) {
					var sessionMatch = true;
					debug.msg('sessionIDs match!', 'models/game.js', 168);	
				} else {
					debug.msg('sessionIDs DO NOT match!', 'models/game.js', 170);	
				}

				if (playerMatch && sessionMatch ) {

					match = seat;
				}

				
			});

			return match;
		}, 

		seatOf: function (socketID) {
			return this.playerExists(socketID);

		},

		startGame: function () {

		},

		register: function (socket) {
			var handle = 		socket.handshake.user.handle
				, playerID = 	socket.handshake.user['_id'].toString()
				, sessionID = 	socket.handshake.sessionID;

			debug.val('playerID', playerID, 'models/game.js', 292);
			debug.val('sessionID', sessionID, 'models/game.js', 293);
			debug.val('this.playerOne', this.playerOne, 'models/game.js', 294);
			debug.val('this.registeredPlayers', this.registeredPlayers, 'models/game.js', 295);
			debug.val('seats', seats, 'models/game.js', 296);

			////////////////////////////////////////////////////////////////////
			//
			// connection screening algorithm
			//
			////////////////////////////////////////////////////////////////////

			
			////////////////////////////////////////////////////////////////////
			//
			// we're good to connect if we've made it this far!
			//
			////////////////////////////////////////////////////////////////////

			// calculate the lowest open seat number
			var seat = this.nextSeat();

			debug.val('seat', seat, 'models/game.js', 381);

			// define the new player
			this.registeredPlayers.push({
				seat: seat,
				handle: handle,
				playerID: playerID,
				sessionID: sessionID
			});
		
			return seat;
		},

		exitLobby: function (handshake) {

			var handle = 		handshake.user.handle
				, playerID = 	handshake.user['_id'].toString()
				, sessionID = 	handshake.sessionID

			debug.val('seat', seat, 'models/game.js', 400);

			// has the player connected?
			var seat = this.playerExists(playerID, sessionID);
			
			debug.val('seat', seat, 'models/game.js', 405);
			
			// if the seat matches the return value of this.sessionExists()...
			if ( seat !== -1) {
				// we have a valid user, delete them!
				if (seat === 0) {
					this.registeredPlayers[0] = {};
				} else {
					this.registeredPlayers[seat].remove();
					
				}


				debug.val('this.registeredPlayers', this.registeredPlayers, 'models/game.js', 418);

				debug.msg(handle + ' has left seat ' + seat + '.', 'models/game.js', 420);
				return true; 

			} else {

				// not sure who this person wants to delete, sorry.
				debug.msg('player not found', 'models/game.js', 426);
				return false;
			}
		}	
	});
	
	// and finally return a model created from GameSchema
	return mongoose.model('Game', GameSchema);
};
