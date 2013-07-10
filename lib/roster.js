var events = require('events');

ERR_NOT_UNIQUE 	= 'the socket is not unique.';
ERR_NO_SEATS 	= 'sorry, but all seats are occupied.';

Roster = function(gameId, firstPlayer, limit) {

	// Rosters are event emitters
	events.EventEmitter.call(this);

	this.playerOne = firstPlayer;

	var self = this
		, players = {}
		, MAX_PLAYERS = limit;

	console.log(typeof MAX_PLAYERS);

	this.getPlayers = function getPlayers() {
		return players;
	};

	this.seatOf = function seatOf(socketID) {
		for (var player in players) {
			if (players[player].socketID === socketID) {
				return player;
			}
		}
		return -1;
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
			debug.msg('socket is player one', 'lib/roster.js', 83);
			return true;
		} else {
			debug.msg('socket is NOT player one', 'lib/roster.js', 86);
			return false;
		}
	};

	/**
	 *	function unique(socket)
	 *
	 * Determines whether or not the given socket is "unique"
	 */
	function unique(playerID, sessionID) {

		debug.vars('players',players, 'lib/roster.js',98);

		// go through all players
		for (var player in players) {

			debug.vars('player',player, 'lib/roster.js',103);

			// if the socket's playerID or sessionID match player's
			if ( playerID === players[player].playerID
			|| sessionID === players[player].sessionID) {
				debug.msg('the socket is NOT unique', 'lib/roster.js', 108);
				// the socket is not unique
				return false;
			}
		};

		debug.msg('the socket IS unique', 'lib/roster.js', 114);
		return true;
	};


	function existing(playerID, sessionID) {
		debug.vars('playerID', playerID, 'lib/roster.js',120);
		debug.vars('sessionID', sessionID, 'lib/roster.js',121);
		debug.vars('players', players, 'lib/roster.js',122);

		for (var player in players) {
			if (players[player].playerID === playerID && players[player].sessionID === sessionID ) {
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

	this.add = function add(socket) {

		var playerID = socket.handshake.user['_id'].toString()
			, sessionID = socket.handshake.sessionID
			, seats = openSeats();

		debug.vars('playerID', playerID, 'lib/roster.js', 153);
		debug.vars('sessionID', sessionID, 'lib/roster.js', 154);
		debug.vars('this.playerOne', this.playerOne, 'lib/roster.js', 155);
		debug.vars('players', players, 'lib/roster.js', 156);
		debug.vars('seats', seats, 'lib/roster.js', 157);



		// if there are no empty seats
		if (!seats) {	
			// deny the socket
			this.emit('denied', ERR_NO_SEATS);
			console.log('denied: ' + ERR_NO_SEATS);
			return false;
		// there is at least one empty seat,  if not unique
		} else if (!unique(playerID, sessionID)) {
			if (existing(playerID, sessionID) === -1) { 
				// deny socket
				this.emit('denied', ERR_NOT_UNIQUE);
				console.log('denied: ' + ERR_NOT_UNIQUE);
				return false;
			} else {
				
			}
		// at least one seat, unique 
		} else { 
			// if player one has not connected	
			if (!players['1']) {
				console.log('player one is not connected');
				// is this socket player one?
				if (isPlayerOne(playerID, sessionID)) {
					console.log('adding the socket to players[\'1\']');
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

					console.log('roster is full, but no player one...')
					// deny the socket, there's no room
					this.emit('denied', ERR_NO_SEATS);
					console.log('denied: ' + ERR_NO_SEATS);
					return false;
				}		
			}

			// calculate the lowest open seat number
			var seatNum = nextSeat();

			debug.vars('seatNum', seatNum, 'lib/roster.js', 217);

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

		var seat = seatOf(socket.id);

		if ( seat !== -1 ) {
			delete players[seat];
			return true; 
		} else {
			return false;
		}
	};	
};

Roster.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = Roster;
