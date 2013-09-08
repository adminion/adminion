
// node core modules
var events = require('events')
	, util = require('util');

// adminion modules
var socketStore = require('../models/socket');

// 3rd party modules
var passportSocketIo = require('passport.socketio')
	, socketio = require('socket.io');


////////////////////////////////////////////////////////////////////////////////
//
// main module constructor
// 
////////////////////////////////////////////////////////////////////////////////

module.exports = function (adminion) {
	var realtime = Object.create(events.EventEmitter.prototype);

	// module cache
	var Sockets = socketStore();
	var Games = {};
	var Accounts = {};

	Object.defineProperty(Games, 'exists', {
		configurable: false,
		enumerable: false,
		writable: false,
		value: function (gameID) {
			return !!this[gameID];
		}
	});

	Object.defineProperty(Accounts, 'exists', {
		configurable: false,
		enumerable: false,
		writable: false,
		value: function (accountID) {
			return !!this[accountID];
		}
	});

	function roster (players) {
		var roster = {};

		for ( var playerNo in players ) {
			var account = Accounts[players[playerNo].accountID]
			roster [playerNo] = account.handle;
		}

		return roster;
	};

	var io = socketio.listen(adminion.http.server);

	// setup socketio server...
	// @see https://github.com/LearnBoost/socket.io/wiki/Configuring-Socket.IO

	// define the authorization scheme
	io.set("authorization", passportSocketIo.authorize({
		cookieParser: 	adminion.http.cookieParser
		, key: 			'adminion.sid'
		, secret: 		adminion.config.session.secret
		, store: 		adminion.http.mongoStore
	}));

	// set the log level to: 2 - info 
	io.set('log level', 3); 
	
	/**
	 * 	function onConnection(socket)
	 *	
	 * Called each time a socket connects to the socket server.
	 */
	io.sockets.on('connection', function (socket) {
		debug.msg('------------------------------ socket connect ----------------------------------', 'lib/realtime', 70);
		// debug.val( 'Sockets', Sockets, 'lib/realtime', 71);

		var accountID = socket.handshake.user['_id']
			, handle = socket.handshake.user.handle
			, socketID = socket.id;

		// initialize a store for the account
		Sockets.initAccount(accountID);

		/**
		 *	function onJoin(gameID)
		 * 
		 * When a socket attempts to join a game
		 */
		socket.on('joinGame', function () {

			// get the id of the game this socket is attempting to join
			var gameID = socket.handshake.headers.referer.split('/')[4];

			// if the game is undefined
			if (!Games.exists(gameID)) {
				
				debug.val('game', game, 'lib/realtime', 94);
				socket.emit('denied', 'invalid gameID: ' + gameID);
				return false; 
			}

			// get a working copy of the game
			var game = Games[gameID];

			// get the number of open seats
			var openSeats = game.openSeats();

			// if registration is still open
			if ( openSeats > 0 ) {
				// in the event that there's only one seat left AND player one is 
				// NOT registered AND this player is not player one..
				if (openSeats === 1 
				&& game.playerOneRegistered() === false 
				&& game.isPlayerOne(accountID) === false) {
					socket.emit('denied', "sorry, we're full!");
					return false;
				}

				// if the account has not registered with the game
				if ( game.isRegistered(accountID) === false) {
					
					// register the account with the game
					game.register(accountID);

					// greet the new account 
					socket.emit('msg', "Welcome, " + handle + "!");

					// tell all the other accounts that the new account entered the lobby
					socket.broadcast.emit('entered', handle);

					// tell all clients the new roster
					io.sockets.in('games/' + gameID).emit('roster', roster(game.playersConnected()));

					debug.msg(util.format('%s entered game lobby %s', handle, gameID), 'lib/realtime.js', 135);
				}
			// however, if registration is closed
			} else {
				// and if this player isn't registered
				if ( game.isRegistered(accountID) === false) {
	
					// deny them access because registration is closed.
					console.log("sorry, we're full!");
					return false;
				}

			}

			// add socket to cache
			Sockets.add(socket)

			// tell the socket who else is connected
			socket.emit('roster', roster(game.playersConnected()));

			// assign event handler for "ready!" event
			socket.on('ready!', function (value) {
				game.accountReady(accountID, value);
			});

			// join the socket to the chat room "gameID"
			socket.join('games/' + gameID );

			return true;
			
		});

		/**
		 *	function onDisconnect(socket)
		 *
		 * When a socket disconnects from 
		 */
		socket.on('disconnect', function () {
			debug.msg('---------------------------- socket disconnect ---------------------------------', 'lib/realtime', 168);

			// get a working copy of the GameID--if any
			var gameID = adminion.util.gameID(socket);

			// debug.val('gameID', gameID, 'lib/realtime.js', 159);			

			if (!!gameID) {

				// get a working copy of the game to which this socket was connected
				var game = Games[gameID];
				
				// say goodbye to the account 
				socket.emit('msg', "Fairwell, " + handle + "!");

				// remote the socket from cache
				Sockets.remove(socket.id);
				
				// if the account has no more sockets and the account was in a game
				if (Sockets.byGame(gameID).byAccount(accountID).length === 0 && game.exitLobby(accountID)) {
					// let all the sockets know that the user has left the lobby
					io.sockets.in('games/' + gameID).emit('exited', handle);

					// roster event on the client tells whether or not 
					io.sockets.in('games/' + gameID).emit('roster', roster(game.playersConnected()));

					// debug.val('game', game, 'lib/realtime.js', 201);
					msg = util.format('%s left game %s', handle, gameID);
					debug.msg(msg, 'lib/realtime.js', 205);
				}

				// debug.val('Sockets', Sockets, 'lib/realtime.js', 208);
								
			}
		});

		socket.on('msg', function (msg) {
			console.log(socket.id + ": " + msg);
			socket.broadcast.emit('msg', socket.id + ": " + msg);
		});

		socket.on('test', function (info) {
			console.log('it looks like we\'re still connected during client\'s disconnect callback..?');
		});

	});
	

	realtime.getAccount = function (accountID) {
		return Accounts[accountID] || false;
	};

	realtime.getAccounts = function (offset, count) {
		offset = Number(offset) || 0;
		count = Number(count) || 20;

		var keys = Object.keys(Accounts);
		var accounts = [];
		var account;

		debug.val('keys', keys, 'lib/realtime', 231);

		for (var i = offset; i < offset + count; i += 1) {

			// which account?
			account = Accounts[keys[i]];

			if (!!account) {
				// add to the accounts array the Account whose key is at index i
				accounts.push(account);
				debug.val('accounts', accounts, 'lib/realtime', 236);
			}
		}

		return accounts;
	};

	realtime.getGame = function (gameID) {
		return Games[gameID] || false;
	};

	realtime.getGames = function (offset, count) {
		offset = Number(offset) || 0;
		count = Number(count) || 20;

		var keys = Object.keys(Games);
		var games = [];
		var game;

		debug.val('keys', keys, 'lib/realtime', 231);

		for (var i = offset; i < offset + count; i += 1) {

			// which game?
			game = Games[keys[i]];

			if (!!game) {
				// add to the games array the Game whose key is at index i
				games.push(game);
				debug.val('games', games, 'lib/realtime', 236);
			}
		}

		return games;

	}

	realtime.on('logon', function (account) {

		Accounts[account['_id']] = account;

		debug.val('Accounts', Accounts, 'lib/realtime.js', 224);
	});

	realtime.on('logoff', function (account) {
		delete Accounts[account['_id']];
		debug.val('Accounts', Accounts, 'lib/realtime.js', 229);
	});

	realtime.on('createGame', function (game) { 
		Games[game['_id']] = game;

		debug.val('Games', Games, 'lib/realtime.js', 252);
	});

	realtime.on('deleteGame', function (gameID) {
		delete (Games[gameID]);
		debug.val('Games', Games, 'lib/realtime.js', 257);
	});

	// fill the cache with all active games when the server starts
	// load all the games with status 'lobby' or 'play' into memory
	adminion.db.games.find( { $or: [{'status' : 'lobby'}, {'status': 'play'} ]}, function (err, games) {

		if (err) {
			throw err;
		}

		debug.val('games', games, 'lib/realtime', 239);

		var game
			, gameID
			, index;

		for (index in games) {
			game = games[index];
			gameID = game['_id'];
			Games[gameID] = game;
			Sockets.initGame(gameID);
		}

		// debug.val('Games', Games, 'lib/realtime.js', 252);

		adminion.db.accounts.find( null, function (err, accounts) {

			if (err) {
				throw err;
			}

			var account
				, accountID
				, index;

			for (index in accounts) {
				account = accounts[index];
				accountID = account['_id'];
				Accounts[accountID] = account;
				Sockets.initAccount(accountID);
			}

			// debug.val('Accounts', Accounts, 'lib/realtime.js', 272);

			realtime.emit('ready');
		});
	});


	// debug.val('realtime', realtime, 'lib/realtime', 277);

	return realtime;

};
