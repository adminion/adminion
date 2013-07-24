var events = require('events');

ERR_PARTIAL_MATCH	= 'the connetion partially matches another connection.';
ERR_NOT_UNIQUE 		= 'the connection is not unique.';
ERR_NO_SEATS 		= 'sorry, but all seats are occupied.';
ERR_NO_PLAYER_ONE 	= 'roster is full, but no player one...';
ERR_UNKNOWN_SOCKET	= 'unknown socketID';

MSG_DUPLICATE 		= 'the connection is a duplicate of an existing user connection.';
MSG_IS_PLAYER_ONE	= 'connection is player one';
MSG_NOT_PLAYER_ONE	= 'connection is NOT player one'
MSG_UNIQUE			= 'the connection IS unique';

Roster = function(firstPlayer, limit) {

	// Rosters are event emitters
	events.EventEmitter.call(this);

	this.playerOne = firstPlayer;

	var self = this
		, players = {}
		, MAX_PLAYERS = limit;

	// console.log(typeof MAX_PLAYERS);

	this.getPlayers = function getPlayers(player) {

		if (player) {
			return players[''+player];
		} else {
			return players;
		}
	};

	this.playerReady = function playerReady(socketID, value) {

		var seatNum = seatOf(socketID);

		if (seatNum !== -1) {

			var count = 0;

			// set the player's ready property to value
			players[seatNum].ready = !!value;

			// count the players that are ready
			players.forEach(function(player) {
				// if this player is ready
				if (player.ready) {
					// add 1 to the count
					count +=1; 
				}
			});
		} else {

		}
	};

	/**
	 * 	function numPlayers()
	 * 
	 * calculates and returns the number of players connected
	 */
	function numPlayers(countP1) {
		var total = 0; 

		for (var player in players) {
			if (player === 1) {
				if (countP1) {
					total +=1;
				}
			} else {
				total += 1;
			}
		};

		return total;
	};

	/**
	 * 	function numPlayers()
	 * 
	 * calculates
	 */
	function openSeats() {
		return MAX_PLAYERS - numPlayers();
	};

	function nextSeat() {
		for (var p = 2; p < MAX_PLAYERS; p += 1) {
			if (!players[''+p]) {
				return p;
			}
		}
	}

	/**
	 *	function isPlayerOne(playerID, sessionID)
	 *
	 * Determines whether or not the given socket is PlayerOne
	 */
	function isPlayerOne(playerID, sessionID) {
		console.log(playerID);
		console.log(self.playerOne.playerID.toString());
		console.log( sessionID);
		console.log( self.playerOne.sessionID);

		if (playerID === self.playerOne.playerID.toString() && sessionID === self.playerOne.sessionID) {
			debug.msg(MSG_IS_PLAYER_ONE, 'lib/roster.js', 83);
			return true;
		} else {
			debug.msg(MSG_NOT_PLAYER_ONE, 'lib/roster.js', 86);
			return false;
		}
	};

	/**
	 *	function unique(socket)
	 *
	 * Determines whether or not the given socket is "unique"
	 */
	function unique(playerID, sessionID) {

		debug.val('players',players, 'lib/roster.js',98);

		// go through all players
		for (var player in players) {

			debug.val('player',player, 'lib/roster.js',103);

			// if the socket's playerID or sessionID match player's
			if ( playerID === players[player].playerID
			|| sessionID === players[player].sessionID) {
				debug.msg(ERR_NOT_UNIQUE, 'lib/roster.js', 108);
				// the socket is not unique
				return false;
			}
		};

		debug.msg(MSG_UNIQUE, 'lib/roster.js', 114);
		return true;
	};


	function duplicate(playerID, sessionID) {
		debug.val('playerID', playerID, 'lib/roster.js',120);
		debug.val('sessionID', sessionID, 'lib/roster.js',121);
		debug.val('players', players, 'lib/roster.js',122);

		for (var player in players) {
			if (players[player].playerID === playerID && players[player].sessionID === sessionID ) {
				debug.msg(MSG_DUPLICATE, 'lib/roster.js', 130);
				return player;
			}
		}

		return -1;
	};



	function allReady() {
		var count = 0;
		var seats = openSeats();

		// count the players that are ready
		players.forEach(function(player) {
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
	}

	/**
	 *	this.add = function add(socket)
	 *
	 * this function adds a socket to the game roster
	 */
	this.add = function add(socket) {

		var playerID = socket.handshake.user['_id'].toString()
			, sessionID = socket.handshake.sessionID
			, seats = openSeats();

		debug.val('playerID', playerID, 'lib/roster.js', 190);
		debug.val('sessionID', sessionID, 'lib/roster.js', 191);
		debug.val('this.playerOne', this.playerOne, 'lib/roster.js', 192);
		debug.val('players', players, 'lib/roster.js', 193);
		debug.val('seats', seats, 'lib/roster.js', 194);



		// if there are no empty seats
		if (!seats) {	
		// there is at least one empty seat,  if not unique
		} else if (!unique(playerID, sessionID)) {

			var seatNum = duplicate(playerID, sessionID);

			// if they already exist
			if (seatNum !== -1) { 
				// allow socket to connect, but, do not add to list.
				return true;

			} else {
				// deny the socket
				debug.msg('denied: ' + ERR_PARTIAL_MATCH,'lib/roster.js', 212);
				return false;
			}
		// at least one seat, unique 
		} else { 
			// if player one has not connected	
			if (!players['1']) {
				console.log('player one is not connected');
				// is this socket player one?
				if (isPlayerOne(playerID, sessionID)) {
					debug.msg('adding the socket to players[\'1\']', 'lib/roster.js', 222);
					players['1'] = {
						handle: socket.handshake.user.handle,
						playerID: playerID,
						sessionID: sessionID,
						socketID: socket.id,
						ready: false
					};

					// assign event handler for "start!" event
					socket.on('start!', function onStart() {
						players['1'].ready = true;
						
						if (allReady()) {
							this.emit('startGame!', true);
						}
					});

					// return "1" because we added player one
					return '1';

				// if the socket is not player one 
				// ...and there is only one seat 
				// ...and player one is not connected
				} else if (seats === 1) {

					// deny the socket, there's no room
					debug.msg('denied: ' + ERR_NO_PLAYER_ONE,'lib/roster.js', 227);
					return false;
				}		
			}

			// when the socket is unique and is not player one...

			// calculate the lowest open seat number
			var seatNum = nextSeat();

			debug.val('seatNum', seatNum, 'lib/roster.js', 217);

			// define the new player
			player = {
				handle: socket.handshake.user.handle,
				playerID: playerID,
				sessionID: sessionID,
				socketID: socket.id,
				ready: false
			};

			// add the player to players
			players[seatNum] = player;
		}
		
		return seatNum;
	};

	// end of this.add()

	this.remove = function remove(socket) {

		var seat = Object.keys(players).indexOf(socketID);

		if ( seat !== -1 ) {
			delete players[seat];
			debug.msg('deleted player ' + seat, 'lib/roster.js', 294);
			return true; 
		} else {
			debug.msg('player not found', 'lib/roster.js', 294);
			return false;
		}
	};	
};

Roster.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = Roster;
