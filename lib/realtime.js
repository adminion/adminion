
// node core modules
var events = require('events')
	, util = require('util');

// Adminion modules
var socketStore = require('../models/socket');

// 3rd party modules
var passportSocketIo = require('passport.socketio')
	, socketio = require('socket.io');

// local pointer to main Adminion instance
var io;

// module cache
var Sockets = new socketStore();
var Games = {};
var Accounts = {};

////////////////////////////////////////////////////////////////////////////////
//
// main module constructor
// 
////////////////////////////////////////////////////////////////////////////////

module.exports = function Realtime (Adminion) {
	Adminion.realtime = Object.create(events.EventEmitter.prototype)

	io = socketio.listen(Adminion.http.server);

	// module initializer

	Adminion.realtime.init = function (onReady) {

		// fill the cache with all active games when the server starts
		// load all the games with status 'lobby' or 'play' into memory
		Adminion.db.Games
		.where('status').or([{'status' : 'lobby'}, {'status': 'play'}])
		.exec(function (err, games) {
			var game
				, gameID
				, index;

			for (index in games) {
				game = games[index]
				gameID = game['_id'];
				Games[gameID] = game;
				Sockets.initGame(gameID);
			}

			debug.val('Games', Games, 'lib/realtime.js', 47);
		});

		Adminion.db.Accounts.find(function (err, accounts) {
			var account
				, accountID
				, index;

			for (index in accounts) {
				account = accounts[index]
				accountID = account['_id'];
				Accounts[accountID] = account;
				Sockets.initAccount(accountID);
			}

			debug.val('Accounts', Accounts, 'lib/realtime.js', 47);
		});


		// setup socketio server...
		// @see https://github.com/LearnBoost/socket.io/wiki/Configuring-Socket.IO

		// define the authorization scheme
		io.set("authorization", passportSocketIo.authorize({
			cookieParser: 	Adminion.http.cookieParser
			, key: 			'adminion.sid'
			, secret: 		Adminion.config.session.secret
			, store: 		Adminion.http.mongoStore
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
			 * When a socket attempts to enter a game lobby
			 */
			socket.on('joinGame', function () {

				var gameID = socket.handshake.headers.referer.split('/')[4];

				var game = Games[gameID];

				if (game === undefined) {
					debug.val('game', game, 'lib/realtime', 94);
					// socket.emit('denied', 'invalid gameID.');
					return false; 
				}

				// registration is still open
				if ( game.openSeats() > 0 ) {
					// debug.ms
					// in the off chance that there's only one seat left AND account one is not registered AND
					// this account is not player one...
					if (game.openSeats() === 1 
					&& game.playerOneRegistered() === false 
					&& game.isPlayerOne(accountID) === false) {
						// registration is closed 
						console.log("sorry, we're full!");
						return false;
					}

					// if the account has not registered with the game
					if ( game.isRegistered(accountID) === false) {
						// do it now
						game.register(accountID);
					}

					// add socket to cache
					Sockets.add(socket)

				// however, if registration is closed
				} else {
					if ( game.isRegistered(accountID) !== false) {
						
						// add socket to cache
						Sockets.add(socket)
					} else {
						console.log("sorry, we're full!");
						return false;
					}

				}
				
				debug.msg(handle + ' was allowed to enter the game.', 'lib/realtime', 117);

				// assign event handler for "ready!" event
				socket.on('ready!', function (value) {
					game.accountReady(accountID, value);
				});

				debug.msg(util.format('%s entered game lobby %s', handle, gameID),
					'lib/realtime.js', 135);
				
				// join the socket to the chat room "gameID"
				socket.join('games/' + gameID );

				// greet the new account 
				socket.emit('msg', "Welcome, " + handle + "!");

				// tell all the other accounts that the new account entered the lobby
				socket.broadcast.emit('entered', handle);

				// get accountInfo for this game

				var roster = game.roster();
				var accountID;
				var accountInfo = {};

				for (var seat in roster) {

					accountID = roster[seat].accountID;

					accountInfo[accountID] = Accounts[accountID];
				}

				debug.val('accountInfo', accountInfo, 'lib/realtime', 182);
				
				// roster event on the client tells whether or not 
				io.sockets.in('games/' + gameID).emit('roster', roster, accountInfo, false);

				
			});

			/**
			 *	function onDisconnect(socket)
			 *
			 * When a socket disconnects from 
			 */
			socket.on('disconnect', function () {
				debug.msg('--------------------------------- socket disconnect ---------------------------------', 'lib/realtime', 168);

				var gameID = Adminion.util.gameID(socket);

				debug.val('gameID', gameID, 'lib/realtime.js', 159);			

				if (!!gameID) {

					var game = Games[gameID];
					
					// say goodbye to the account 
					socket.emit('msg', "Fairwell, " + handle + "!");

					Sockets.remove(socket.id);

					var inGame = Sockets.byGame(gameID);

					// this might be true if we just restarted and have a stale connection.. we should probably do an init method on connect"
					if (inGame !== false) {
						// if the account has no more sockets
						if (inGame.byAccount(accountID).length === 0) {

							// the account has left the lobby
							game.exitLobby(accountID);

							// let all the sockets know that the user has left the lobby
							io.sockets.in('games/' + gameID).emit('exited', handle);

							// now let them all know the new roster
							io.sockets.in('games/' + gameID).emit('roster', game.roster());
							
							// debug.val('game', game, 'lib/realtime.js', 201);
						}

						msg = util.format('%s left game %s', handle, gameID);
						debug.msg(msg, 'lib/realtime.js', 205);
										
						// debug.val('Sockets', Sockets, 'lib/realtime.js', 208);
					}
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

		onReady(this);
	};

	Adminion.realtime.getAccount = function (accountID) {
		return Accounts[accountID] || false;
	};

	Adminion.realtime.getAccounts = function () {
		return Accounts || false;
	};

	Adminion.realtime.getGame = function (gameID) {
		return Games[gameID] || false;
	};

	Adminion.realtime.getGames = function () {
		return Games || false;
	}

	////////////////////////////////////////////////////////////////////////////
	//
	//  S E T U P   E V E N T   H A N D L E R S
	//
	////////////////////////////////////////////////////////////////////////////

	Adminion.realtime.on('logon', function (account) {
		// create a reference to the account for later
		Accounts[account['_id']] = account;

		debug.val('Accounts', Accounts, 'lib/realtime.js', 224);
	});



	Adminion.realtime.on('logoff', function (accountID) {
		delete Accounts[accountID];
		debug.val('Accounts', Accounts, 'lib/realtime.js', 229);
	});



	Adminion.realtime.on('createGame', function (game) { 
		Games[game['_id']] = game;

		debug.val('Games', Games, 'lib/realtime.js', 252);
	});



	Adminion.realtime.on('deleteGame', function (gameID) {
		delete (Games[gameID]);
		debug.val('Games', Games, 'lib/realtime.js', 257);
	});

};