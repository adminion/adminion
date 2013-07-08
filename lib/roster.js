
var events = require('events');

ERR_NOT_UNIQUE 	= 'something smells fishy...';
ERR_NO_SEATS 	= 'sorry, but all seats are occupied';

Roster = function(gameId, firstPlayer, limit) {

	// Rosters are event emitters
	events.EventEmitter.call(this);

	this.playerOne = firstPlayer;

	var self = this
		, friends = []
		, MAX_FRIENDS = limit;

	/**
	 * 	function numFriends()
	 * 
	 * calculates and returns the number of friends connected
	 */
	function numFriends() {
		var count = 0; 

		friends.forEach(function(friend) {
			count += 1; 
		});

		return count;
	};

	/**
	 *	function isPlayerOne(socket, Boolean checkSessionID)
	 *
	 * Determines whether or not the given socket is PlayerOne
	 */
	function isPlayerOne(socket, checkSessionID) {
		var identical; 

		// sets identical to true if all attributes match, false if not
		identical = (socket.handshake.user['_id'] === self.playerOne.playerID
			&& sessionID === self.playerOne.sessionID);

		if (checkSessionID) { 
			identical = (socket.id === self.playerOne.socketID);
		}

		return identical;
	};

	/**
	 *	function unique(socket)
	 *
	 * Determines whether or not the given socket is "unique"
	 */
	function unique(playerID, sessionID) {
		var unique = true;

		// if socket's playerID, sessionID, or socketID match player's
		if (playerID === self.playerOne.playerID
		|| sessionID === self.playerOne.sessionID) {	
			// the socket is not unique
			debug.msg('something similar to playerOne','lib/roster.js', 65);
			unique = false;
		}

		// go through each friend
		friends.forEach(function(friend) {
			// if the socket's playerID, sessionID, or socketID match playerOne's
			debug.vars('friends',friends, 'lib/roster.js',71);

			if (playerID === friend.playerID
			|| sessionID === friend.sessionID) {
				// the socket is not unique
				unique = false;
			}
		});

		return unique;
	};

	this.add = function add(socket) {

		// if there are no empty seats
		if (MAX_FRIENDS - numFriends()	 === 0 ) {	
			this.emit('denied', ERR_NO_SEATS);
			console.err(ERR_NO_SEATS);
			process.exit();
		} else {

			// if the socket is NOT unique
			if (!unique(playerID, socket.sessionID)) {
				this.emit('denied', ERR_NOT_UNIQUE);
				console.error('denied: ' + ERR_NOT_UNIQUE);
				process.exit();
			// if the socket IS unique
			} else {

				// if playerOne has NOT joined the game and the socket is playerOne
				if (!this.playerOne.socketID && isPlayerOne(socket)) {
					// add the socket id to this.playerOne
					this.playerOne.socket = socket;
				} else {
					// add the friend to friends
					friends[socket.handshake.user['_id']] = {
						handle: socket.handshake.user.handle,
						sessionID: socket.handshake.sessionID,
						ready: false
					};

					socket.on('ready!', function socketOnReady(value) {
						var count = 0;

						// set the friend's ready property to value
						friends[socket.handshake.user['_id']].ready = !!value;

						// count the friends that are ready
						friends.forEach(function(friend) {
							// if this friend is ready
							if (friend.ready) {
								// add 1 to the count
								count +=1; 
							}
						});

						// notify playerOne that all friends are ready
						self.playerOne.emit(
							'ready', 
							( count === numFriends() )
						);
					});
				}
				
				debug.vars('this.playerOne', this.playerOne, 'lib/roster.js', 115);
				debug.vars('friends', friends, 'lib/roster.js', 116);

				// join the socket to the chat room "gameId"
				socket.join(gameId);

				// greet the new player 
				socket.emit('msg', "Welcome, " + socket.id + "!");

				// tell everyone except the new player that the new player joined the game
				socket.broadcast.emit('joined', socket.id, friends);

				// return the number of open seats remaining
				return MAX_FRIENDS - numFriends();
			}
		}
	};

	this.remove = function remove(socketID) {
		if (!!friends[socketID]) {
			delete friends[socketID];
			return true; 
		} else {
			return false;
		}
	};	
};

Roster.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = Roster;
