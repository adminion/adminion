



module.exports = function SocketCache() {
	var sockets = [];

	this.byID = function(socketID) {
		var matches = [];

		// go through the list of sockets
		sockets.forEach(function(socket) {
			// if this socket's id is equal to socketID
			if (socket.id === socketID) {
				// add this socket to the list of 'matches'
				matches.push(socket);
			}
		});

		return matches;
	};

	this.byPlayer = function(playerID) {
		var matches = [];

		sockets.forEach(function(socket) {
			if (socket.handshake.user['_id'] === playerID) {
				matches.push(socket);
			}
		});

		return matches;
	};

	this.byGame = function(gameID) {
		var matches = [];

		sockets.forEach(function(socket) {
			// this really needs to be double-checked..
			if (socket.handshake.headers.url.split('/')[4] === playerID) {
				matches.push(socket);
			}
		});

		return matches;
	};
}