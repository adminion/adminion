
var util = require('../lib/util');

module.exports = function SocketCache () {
	var Sockets = [];
	var self = this;

	// quick reference arrays
	var byID		= {}
		, byGame 	= {}
		, byAccount 	= {}

	// public method for caching a socket
	this.add = function (socket) {

		debug.msg('adding socket ' + socket.id, 'models/socket.js', 26);

		// add the socket to the list and make note of its current index
		var which = Sockets.push(socket) -1;
		var gameID = util.gameID(socket);
		var accountID = util.accountID(socket);

		// if the store for this game is not yet defined
		if (byGame[gameID] === undefined) {
			// create a new array store
			byGame[gameID] = [];
		}

		// and do the same for the player store
		if (byAccount[accountID] === undefined) {
			byAccount[accountID] = [];
		}

		// create references to the stored socket
		byID[socket.id] = Sockets[which];
		byGame[gameID].push(Sockets[which]);
		byAccount[accountID].push(Sockets[which]);

		debug.val('Sockets', Sockets, 'models/socket.js', 49);
		debug.val('byID', byID, 'models/socket.js', 50);
		debug.val('byGame', byGame, 'models/socket.js', 51);
		debug.val('byAccount', byAccount, 'models/socket.js', 52);

		return Sockets.length;

	};

	// public method for removing a socket from cache
	this.remove = function (socketID) {

		debug.msg('removing socket ' + socketID, 'models/socket.js', 61);

		var socket; 
		var which;
		
		console.log(Sockets.length);

		// determine at which index this socket is hanging out
		for (var i = 0; i < Sockets.length; i+=1) {
			console.log(i)
			// when we find it
			if (Sockets[i].id === socketID) {
				// save the index and stop searching
				which = i;
				socket = Sockets[i];
				console.log('breaking at ' + i);
				break;
			}
		}

		if (socket === undefined) {
			return false;
		}

		// get details for readability
		var socketID = socket.id;
		var gameID = util.gameID(socket);
		var accountID = AccountID(socket);

		// delete references to the stored socket...
		delete byID[socketID];

		// search for this socket in the byGame array
		for (var i = 0; i < byGame[gameID].length; i+=1) {
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

		// for this socket in the byAccount array
		for (var i = 0; i < byAccount[accountID].length; i+=1) {
			// when we find it
			if (byAccount[accountID][i].id === socketID) {
				// delete the index and stop searching
				delete byAccount[accountID][i];
				break;
			}
		}

		// now finally delete the socket itself
		Sockets.splice(which,1);

		debug.val('Sockets', Sockets, 'models/socket.js', 116);
		debug.val('byID', byID, 'models/socket.js', 117);
		debug.val('byGame', byGame, 'models/socket.js', 118);
		debug.val('byAccount', byAccount, 'models/socket.js', 119);

		return Sockets.length;
	};


	// public method for returning sockets indexed by their ID
	this.byID = function (socketID) {
		return byID[socketID];
	};

	// public method for returning all sockets belonging to the specified Account
	this.byAccount = function (accountID) {
		var list = byAccount[accountID];

		if (list.byGame === undefined) {
			// declare byGame method
			Object.defineProperty(list, 'byGame', {
				configurable: false,
				enumerable: false,
				writable: false,
				value: function (gameID) {
					var inGame = [];
					var socket;

					for ( var i = 0; i < list.length; i +=1) {
						socket = list[i];

						if (util.gameID(socket) === gameID) {
							inGame.push(socket); 
						}
					}

					return inGame;
				}
			});
		}

		// now return a nice pretty listing of this person's sockets
		// with nice method to get only sockets connected to a certain game
		return list;

	};

	// public method for returning sockets connected to the Game with the given id
	this.byGame = function (gameID) {
		var list = byGame[gameID] || [];

		if (list.byAccount === undefined) {
			// declare byAccount method to get sockets belonging to one player
			Object.defineProperty(list, 'byAccount', {
				configurable: false,
				enumerable: false,
				writable: false,
				value: function (accountID) {
					var belongToAccount = [];
					var socket;

					for ( var i = 0; i < list.length; i+=1) {
						socket = list[i];

						if (util.accountID(socket) === accountID) {
							belongToAccount.push(socket);
						}
					}

					return belongToAccount;
				}
			});
			
		}

		return list;
	};

	debug.val('Sockets', Sockets, 'models/socket.js', 195);
	debug.val('byID', byID, 'models/socket.js', 196);
	debug.val('byGame', byGame, 'models/socket.js', 197);
	debug.val('byAccount', byAccount, 'models/socket.js', 198);

};