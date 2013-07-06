
// calculate the number of empty seats



module.exports = function Roster (firstPlayer, limit) {
	// Rosters are event emitters
	require('events').EventEmitter.call(this);

	this.playerOne = firstPlayer
		, this.friends = {}
		, this.maxFriends = limit;

	// calculates and returns the number of open seats
	this.openSeats = function() {
		var count = 0; 

		// go through each friend connected
		for (var friend in this.friends) {
			count += 1;
		}

		// return the limit less the number of friends connected
		return this.maxFriends - count;
	};

	// calculates and returns the number of friends connected
	this.friendsConnected = function() {
		var count = 0; 

		for (var friend in this.friends) {
			if (this.friends[friend] !== undefined) {
				count += 1; 
			}
		}

		return count;
	};

	this.isPlayerOne = function(socket) {
		return (socket.handshake.user['_id'] === this.playerOne.playerID
			|| socket.handshake.address.address === this.playerOne.remoteIP 
			|| sessionID === this.playerOne.sessionID
			|| socket.id === this.playerOne.socketID);
	}

	this.add = function(socket) {

		// if playerOne has NOT joined the game
		if (!this.playerOne.socketID) {

			// if this socket is player one
			if (socket.handshake.user['_id'] === this.playerOne.playerID
				&& socket.handshake.address.address === this.playerOne.remoteIP
				&& socket.handshake.sessionID === this.playerOne.sessionID) {
				
				// add the socket id to this.playerOne
				this.playerOne.socketID = socket.id;
			}
		// if playerOne HAS joined the game
		} else {
			// make sure the socket isn't playerOne accidentally connecting twice

			// if the connecting user shares any of playerOne's attributes..
			if (this.isPlayerOne(socket)) {

				// do not join, disconnect socket
				socket.emit('denied', 'something smells fishy...');
				socket.disconnect();
				return false;
			}
		}

		// now verify that the socket attempting to connect has not already
		// go through each friend
		for (var friend in this.friends) {
			// if the playerIDs, remoteIPs, sessionIDs, or socketIDs match
			if (socket.handshake.user['_id'] === this.friends[friend].playerID
				|| socket.handshake.address.address === this.friends[friend].remoteIP 
				|| sessionID === this.friends[friend].sessionID
				|| socket.id === this.friends[friend].socketID ) {
				
				// do not join, disconnect socket
				socket.emit('denied', 'something smells fishy...');
				socket.disconnect();
				return false;
			}
		}

		// if we made it this far, we'll assume they're legit; add to this.friends
		this.friends[socket.id] = {
			playerID: socket.handshake.user['_id'],
			remoteIP: socket.handshake.address.address,
			sessionID: socket.handshake.sessionID,
			socketID: socket.id,
			ready: false
		};

		debug.vars('this.friends', this.friends, 'lib/roster.js', 101);

		// get the number of open seats remaining
		var openSeats = this.openSeats();

		// output to the console the number of seats remaining
		switch (openSeats) {
			case 1: 
				debug.msg('there is 1 open seat!', 'lib/roster.js', 109);
				break;
			default:
				debug.msg('there are ' + openSeats + ' open seats.', 'lib/roster.js', 112);
		}

		return true;
	};

	this.remove = function(socketID) {
		if (!!this.friends[socketID]) {
			delete this.friends[socketID];
			return true; 
		} else {
			return false;
		}
	};

	this.friendReady = function(fid, value) { 
		var count = 0;

		// if the friend isn't connected
		if (!this.friends[fid]) {
			// throw an error, because something is wrong somewhere...
			throw new Error('friend is not connected!');

		// if the friend is connected
		} else {
			// set the friend's ready property to value
			this.friends[fid].ready = value;

			// count the friends that are ready
			this.friends.foreach(function(friend) {
				// if this friend is ready
				if (!!friend.ready) {
					// add 1 to the count
					count +=1; 
				}
			});

			// if the count is equal to the number of friends connected
			if (count === this.friendsConnected()) {
				// everyone is ready!
				this.emit('READY');
			}
		}
	};
	
}