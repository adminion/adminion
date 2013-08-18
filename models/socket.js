
var util = require('../lib/util');

function GameID (socket) {
	//    0     1         2	           3              4
	// https: /   / localhost:1337 / games / abcdefghi12345678990
	return socket.handshake.headers.url.split('/')[4];
};

function PlayerID (socket) {
	return socket.handshake.user['_id'];
};

module.exports = function SocketCache () {
	var sockets = [];
	var self = this;

	// quick reference arrays
	var byID		= {}
		, byGame 	= {}
		, byPlayer 	= {}

	// public method for caching a socket
	this.add = function (socket) {
		// add the socket to the list and make note of its current index
		var which = sockets.push(socket) -1;
		var gameID = GameID(socket);
		var playerID = PlayerID(socket);

		// if the store for this game is not yet defined
		if (byGame[gameID] === undefined) {
			// create a new array store
			byGame[gameID] = [];
		}

		// and do the same for the player store
		if (byPlayer[playerID] === undefined) {
			byPlayer[playerID] = [];
		}

		// create references to the stored socket
		byID[socket.id] = sockets[which];
		byGame[gameID].push(sockets[which]);
		byPlayer[playerID].push(sockets[which]);

		return sockets.length;

	};

	// public method for removing a socket from cache
	this.remove = function (socketID) {

		var socket; 
		var which;

		// determine at which index this socket is hanging out
		for (var i = 0; i < sockets.length; i+=1 {
			// when we find it
			if (sockets[i].id === socketID) {
				// save the index and stop searching
				which = i;
				socket = sockets[i];
				break;
			}
		}

		// get details for readability
		var socketID = socket.id;
		var gameID = GameID(socket);
		var playerID = PlayerID(socket);

		// delete references to the stored socket...
		delete byID[socketID];

		// search for this socket in the byGame array
		for (var i = 0; i < byGame[gameID].length; i+=1 {
			// when we find it
			if (byGame[gameID][i].id === socketID) {
				// remove the socket from the list and stop searching
				byGame[gameID].splice(i,1);
				break;
			}
		}

		// if there are no more sockets in this game, delete the list 
		if (byGame[gameID].length === 0) {
			delete byGame[gameID];
		}

		// for this socket in the byPlayer array
		for (var i = 0; i < byPlayer[playerID].length; i+=1 {
			// when we find it
			if (byPlayer[playerID][i].id === socketID) {
				// delete the index and stop searching
				delete byPlayer[playerID][i];
				break;
			}
		}

		// now finally delete the socket itself
		sockets.splice(which,1);

		return sockets.length;
	};


	// public method for returning sockets indexed by their ID
	this.byID = function(socketID) {
		return byID[socketID];
	};

	// public method for returning all sockets belonging to the specified Player
	this.byPlayer = function(playerID) {
		var player = {
			// the raw list of sockets belonging to this player
			sockets : byPlayer[playerID]
		};

		// declare byGame method
		Object.defineProperty(player, 'byGame', {
			configurable: false,
			enumerable: false,
			writable: false,
			value: function (gameID) {
				var inGame = [];
				var socket;

				for ( var i = 0; i < this.sockets.length; i +=1) {
					socket = this.sockets[i];

					if (GameID(socket) === gameID) {
						inGame.push(socket);
					}
				});

				return inGame;
			}
		});

		// now return a nice pretty listing of this person's sockets
		// with nice method to get only sockets connected to a certain game
		return player;

	};

	// public method for returning sockets connected to the Game with the given id
	this.byGame = function(gameID) {
		var game = {
			// the raw list of sockets conencted to this game
			sockets : byPlayer[playerID]
		};

		// declare byPlayer method to get sockets belonging to one player
		Object.defineProperty(game, 'byPlayer', {
			configurable: false,
			enumerable: false,
			writable: false,
			value: function (playerID) {
				var belongToPlayer = [];
				var socket;

				for ( var i = 0; i < this.sockets.length; i+=1) {
					socket = this.sockets[i];

					if (PlayerID(socket) === playerID) {
						arePlayer.push(socket);
					}
				});

				return inGame;
			}
		});

		return game;
	};

};