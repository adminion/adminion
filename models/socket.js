
function GameID(socket) {
	//    0     1         2	           3              4
	// https: /   / localhost:1337 / games / abcdefghi12345678990
	return socket.handshake.headers.url.split('/')[4];
};

module.exports = function SocketCache () {
	var sockets = [];
	var indexed = {};

	var indexes = [
		'id',
		'player',
		'game'
	];

	// rebuild an entire index
	function rebuildIndex (index) {
		if (!sockets[index]) {
		// create a container if it doesn't already exist
			sockets[index] = {};
		}

		var indexValues = [];
		var tmp = {};
		
		// get a list of the index values
		switch (index) {
			case 'id':
				// go through all the sockets
				for (var socket in sockets) {
					var socketID = sockets[socket]['_id'];
					// add the index value to the list
					indexValues.push(socketID);
					// make a temporary reference to the socket via the index value
					tmp [socketID] = socket;
				}
				break;

			case 'player': 
				for (var socket in sockets) {
					var playerID = sockets[socket].handshake.user['_id'];
					indexValues.push(playerID);
					tmp [playerID] = socket;
				}
				break;

			case 'game':
				for (var socket in sockets) {
					var gameID = GameID(sockets[socket]);
					indexValues.push(gameID);
					tmp [gameID] = socket;
				}
				break;
		}

		// now sort the index values
		indexValues.sort();

		// go through all the index values
		for(var indexValue in indexValues) {
			// add each socket to the index
			// confused yet?
			indexed[index][indexValue] = tmp[indexValue];
		};

	};

	// rebuild all indexes
	function rebuildIndexes () {
		indexes.forEach(function (index) {
			rebuildIndex(index);
		});
	};

	// public instances
	this.rebuildIndex = rebuildIndex;
	this.rebuildIndexes = rebuildIndexes;

	// public method for caching a socket
	this.add = function (socket) {
		// add the socket to the list
		sockets.push(socket);

		// rebuild the indexes
		rebuildIndexes();
	};

	// public method for returning sockets indexed by ID
	this.byID = function() {
		return indexed.id;
	};

	// public method for returning sockets indexed by Player
	this.byPlayer = function() {
		return indexed.player;
	};

	// public method for returning sockets indexed by Game
	this.byGame = function() {
		return sockets.game;
	};

	// public method for returning a cached socket by its ID
	this.whereID = function (socketID) {
		return indexed.id[socketID] || false;
	};

	// public method for returning a cached socket by its player's ID
	this.wherePlayer = function (playerID) {
		return indexed.player[playerID] || false;
	};

	// public method for returning a cached socket by its game's ID
	this.whereGame = function (gameID) {
		return indexed.game[gameID] || false;
	};
};