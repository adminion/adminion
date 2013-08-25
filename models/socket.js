
var util = require('../lib/util');

module.exports = function SocketCache () {
	var Sockets = [];
	var self = this;

	// quick reference arrays
	var byID		= {}
		, byGame 	= {}
		, byAccount 	= {}

	Object.defineProperty(byGame, 'length', {
		configurable: false,
		enumerable: false,
		writable: false,
		value: function () {
			var count = 0;

			for ( i in this ) {
				if (this[i] !== undefined) {
					count +=1;
				}
			}

			return count;
		}
	});

	Object.defineProperty(byAccount, 'length', {
		configurable: false,
		enumerable: false,
		writable: false,
		value: function () {
			var count = 0;

			for ( i in this ) {
				if (this[i] !== undefined) {
					count +=1;
				}
			}

			return count;
		}
	});

	this.initAccount = function (accountID) {
		byAccount[accountID] = [];

		Object.defineProperty(byAccount[accountID], 'byGame', {
			configurable: false,
			enumerable: false,
			writable: false,
			value: function (gameID) {
				var inGame = [];
				var socket;

				for ( var i = 0; i < byAccount[accountID].length; i +=1) {
					socket = byAccount[accountID][i];

					if (util.gameID(socket).toString() === gameID.toString()) {
						inGame.push(socket); 
					}
				}

				return inGame;
			}
		});
	};

	this.initGame = function (gameID) {
		byGame[gameID] = [];

		// declare byAccount method to get sockets belonging to one player
		Object.defineProperty(byGame[gameID], 'byAccount', {
			configurable: false,
			enumerable: false,
			writable: false,
			value: function (accountID) {
				var belongToAccount = [];
				var socket;

				for ( var i = 0; i < byGame[gameID].length; i+=1) {
					socket = byGame[gameID][i];

					if (util.accountID(socket).toString() === accountID.toString()) {
						belongToAccount.push(socket);
					}
				}

				return belongToAccount;
			}
		});
	};

	// public method for caching a socket
	this.add = function (socket) {

		debug.msg('adding socket ' + socket.id, 'models/socket.js', 50);

		// add the socket to the list and make note of its current index
		var which = Sockets.push(socket) -1;
		var gameID = util.gameID(socket);
		var accountID = util.accountID(socket);

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

		debug.val('Sockets', Sockets, 'models/socket.js', 85);
		debug.val('byID', byID, 'models/socket.js', 86);
		debug.val('byGame', byGame, 'models/socket.js', 87);
		debug.val('byAccount', byAccount, 'models/socket.js', 88);

		debug.msg('removing socket ' + socketID, 'models/socket.js', 90);

		var socket; 
		var which;
		
		debug.msg(Sockets.length + (Sockets.length === 1) ? " socket" : " sockets", 'models/socket.js', 95);

		// determine at which index this socket is hanging out
		for (var i = 0; i < Sockets.length; i+=1) {
			console.log(i)
			// when we find it
			if (Sockets[i].id === socketID) {
				// save the index and stop searching
				which = i;
				socket = Sockets[i];
				console.log('socket stored at index ' + i);
				break;
			}
		}

		if (socket === undefined) {
			return false;
		}

		// get details for readability
		var socketID = socket.id;
		var gameID = util.gameID(socket);
		var accountID = util.accountID(socket);

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

		// for this socket in the byAccount array
		for (var i = 0; i < byAccount[accountID].length; i+=1) {

			debug.val('byAccount[accountID]', byAccount[accountID], 'models/sockets.js', 140);

			// when we find it
			if (byAccount[accountID][i].id === socketID) {
				// delete the index and stop searching
				byAccount[accountID].splice(i,1);;
				break;
			}
		}

		// if there are no more sockets in this game, delete the list 
		if (byAccount[accountID].length === 0) {
			delete byAccount[accountID];
		}		

		// now finally delete the socket itself
		Sockets.splice(which,1);

		debug.val('Sockets', Sockets, 'models/socket.js', 153);
		debug.val('byID', byID, 'models/socket.js', 154);
		debug.val('byGame', byGame, 'models/socket.js', 155);
		debug.val('byAccount', byAccount, 'models/socket.js', 156);

		return Sockets.length;
	};


	// public method for returning sockets indexed by their ID
	this.byID = function (socketID) {
		return byID[socketID];
	};

	// public method for returning all sockets belonging to the specified Account
	this.byAccount = function (accountID) {
		
		return byAccount[accountID] || false;
	};

	// public method for returning sockets connected to the Game with the given id
	this.byGame = function (gameID) {
		
		return byGame[gameID] || false;
	};

	debug.val('Sockets', Sockets, 'models/socket.js', 236);
	debug.val('byID', byID, 'models/socket.js', 237);
	debug.val('byGame', byGame, 'models/socket.js', 238);
	debug.val('byAccount', byAccount, 'models/socket.js', 239);

};