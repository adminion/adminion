
var events = require('events');

ERR_NOT_UNIQUE 	= 'something smells fishy...';
ERR_NO_SEATS 	= 'sorry, but all seats are occupied';

Roster = function(gameId, firstPlayer, limit) {

	// Rosters are event emitters
	events.EventEmitter.call(this);

	this.playerOne = firstPlayer;

	var self = this
		, players = []
		, MAX_PLAYERS = limit;

	/**
	 * 	function numPlayers()
	 * 
	 * calculates and returns the number of players connected
	 */
	function numPlayers(count) {
		var count = 0; 

		for (var player in players) {
			if (count && player === 1) {
				count += 1; 
			} 
			count +=1;
		};

		return count;
	};

	/**
	 *	function isPlayerOne(playerID, sessionID)
	 *
	 * Determines whether or not the given socket is PlayerOne
	 */
	function isPlayerOne(playerID, sessionID) {
		var identical; 

		// if playerIDs match
		if (playerID === self.playerOne.playerID) {
			// if sessionIDs match
			if (sessionID === self.playerOne.sessionID) {
				// both match, return 1 (true)
				return 1;
			// if sessionIDs do not match
			} else {
				// sessionID does not match, return -1 (partial)
				return -1;
			}
		// if playerIDs do not match
		} else {
			// if sessionIDs match
			if (sessionID === self.playerOne.sessionID) {
				// playerID does not match, return -1 (partial)
				return -1;
			// if sessionIDs do not match
			} else {
				// neither match, return 0 (false)
				return 1;
			}
		}
	};

	/**
	 *	function unique(socket)
	 *
	 * Determines whether or not the given socket is "unique"
	 */
	function unique(playerID, sessionID) {

		// go through all players
		for (var players in players) {
			// if the socket's playerID, sessionID, or socketID match playerOne's
			debug.vars('players',players, 'lib/roster.js',71);

			if (playerID === players[player].playerID
			|| sessionID === players[player].sessionID) {
				// the socket is not unique
				return false;
			}
		};

		return true;
	};

	this.add = function add(socket) {

		var playerID = socket.handshake.user['_id']
			, sessionID = socket.sessionID;

		// if there are no empty seats
		if ((MAX_PLAYERS - numPlayers(true) === 0)) {	
			this.emit('denied', ERR_NOT_UNIQUE);
			console.error('denied: ' + ERR_NOT_UNIQUE);
			socket.disconnect();
			return false;
		// if there are empty seats
		} else {
			// if the socket is player one
			if (isPlayerOne(playerID, sessionID)) {
				// if player one has already connected
				if (players[1]) {
					this.emit('denied', ERR_NOT_UNIQUE);
					console.error('denied: ' + ERR_NOT_UNIQUE);
					socket.disconnect();
					return false;
				// if player one has not connected
				} else {
					// add the socket to players[1]
					players[1] = {
						handle: socket.handshake.user.handle,
						playerID: socket.handshake.user['_id'],
						sessionID: socket.sessionID,
						socketID: socket.id
					};
				}
			// if the socket is not unique
			} else if (!unique(playerID, sessionID)) {
				this.emit('denied', ERR_NOT_UNIQUE);
				console.error('denied: ' + ERR_NOT_UNIQUE);
				socket.disconnect();
				return false;
			// if the socket is unique
			} else {
				var playerNum = numPlayers() + 1;

				// add the player to players
				players[playerNum] = {
					handle: socket.handshake.user.handle,
					sessionID: socket.handshake.sessionID,
					socketID: socket.id,
					ready: false
				};

				socket.on('ready!', function socketOnReady(value) {
					var count = 0;

					// set the player's ready property to value
					players[socket.handshake.user['_id']].ready = !!value;

					// count the players that are ready
					players.forEach(function(player) {
						// if this player is ready
						if (player.ready) {
							// add 1 to the count
							count +=1; 
						}
					});

					// emit the ready event
					if 	( count === numPlayers() ) {
						this.emit('ready', true);
					}	
				});
				
				debug.vars('this.playerOne', this.playerOne, 'lib/roster.js', 115);
				debug.vars('players', players, 'lib/roster.js', 116);

				// join the socket to the chat room "gameId"
				socket.join(gameId);

				// greet the new player 
				socket.emit('msg', "Welcome, " + socket.id + "!");

				// tell everyone except the new player that the new player joined the game
				socket.broadcast.emit('joined', socket.id, players);

				// return the number of open seats remaining
				return MAX_PLAYERS - numPlayers(true);
			}
		}
	};

	this.remove = function remove(socketID) {
		if (!!players[socketID]) {
			delete players[socketID];
			return true; 
		} else {
			return false;
		}
	};	
};

Roster.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = Roster;
