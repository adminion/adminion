
// node core modules
var events = require('events')
	, util = require('util');

// Adminion modules
var socketStore = require('../models/socket');

// 3rd party modules
var passportSocketIo = require('passport.socketio')
	, socketio = require('socket.io');

// local pointer to main Adminion instance
var Adminion
	, io;

var Sockets = new socketStore();
var Games = {};
var Accountsc = {};

function Realtime() {
	var self = this;

	events.EventEmitter.call(this);

	io = socketio.listen(Adminion.http.server);

	// module initializer

	this.init = function (onReady) {
		// fill the cache with all active games when the server starts
		// load all the games with status 'lobby' or 'play' into memory
		Adminion.db.Games.where('status').or([{'status' : 'lobby'}, {'status': 'play'}])
			.exec(function (err, games) {
				var game
					, gameID
					, index;

				for (index in games) {
					game = games[index]
					gameID = game['_id'];
					self.games[gameID] = game;
				}

				debug.val('self.games', self.games, 'lib/realtime.js', 47);
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
			debug.val( 'self.sockets', self.sockets, 'lib/realtime', 71);

			var player = socket.handshake.user
				, handle = player.handle
				, playerID = player['_id']
				, sessionID = socket.sessionID;

			/**
			 *	function onJoin(gameID)
			 * 
			 * When a socket attempts to enter a game lobby
			 */
			socket.on('joinGame', function () {

				var gameID = socket.handshake.headers.referer.split('/')[4];

				var game = this.games[gameID];

				// registration is still open
				if ( game.registration ) {
					// in the off chance that there's only one seat left AND player one is not registered
					if (game.openSeats === 1 && !game.playerOneRegistered && !game.isPlayerOne(playerID)) {
						// deny: sorry, we're full!
					}

					// if the player has not registered with the game
					if ( !game.isRegistered(socket) ) {
						// do it now
						game.register(socket);
					}

					// add socket to cache
					sockets.add(socket)

				// however, if registration is closed
				} else {
					if ( game.isRegistered(socket) ) {
						
						// add socket to cache
						sockets.add(socket)
					} else {
						// deny: sorry, we're full!
					}

				}
				
				debug.msg(handle + ' was allowed to enter the game.', 'lib/realtime', 117);

				// assign event handler for "ready!" event
				socket.on('ready!', function (value) {
					game.playerReady(playerID, value);
				});

				debug.msg(util.format('%s entered game lobby %s', handle, gameID),
					'lib/realtime.js', 135);
				
				// join the socket to the chat room "gameID"
				socket.join('games/' + gameID );

				// greet the new player 
				socket.emit('msg', "Welcome, " + handle + "!");

				// tell all the other players that the new player entered the lobby
				socket.broadcast.emit('entered', handle);
				io.sockets.in('games/' + gameID).emit('roster', game.whosConnected());

				
			});

			/**
			 *	function onDisconnect(socket)
			 *
			 * When a socket disconnects from 
			 */
			socket.on('disconnect', function () {
				debug.msg('---------------------------- socket disconnect ---------------------------------', 'lib/realtime', 168);

				debug.val('socket.handshake', socket.handshake, 'lib/realtime.js', 170);
				debug.val('self.sockets', self.sockets, 'lib/realtime.js', 171);

				//    0     1         2	           3              4
				// https: /   / localhost:1337 / games / abcdefghi12345678990
				var gameID = socket.handshake.headers.referer.split('/')[4];

				debug.val('gameID', gameID, 'lib/realtime.js', 177);			

				var playerID = socket.handshake.user['_id'];

				if (!!gameID) {
					
					// say goodbye to the player 
					socket.emit('msg', "Fairwell, " + socket.id + "!");

					if (self.players[playerID] && self.players[playerID][socket.id] ) {
						delete self.players[playerID][socket.id];
						// if the player has no more sockets
						if (Object.keys(self.players[playerID]).length === 0) {

							// the player has left the lobby
							game.exitLobby(socket.handshake);

							// let all the sockets know that the user has left the lobby
							io.sockets.in(gameID).emit('exited', handle);

							// now let them all know the new roster
							io.sockets.in(gameID).emit('roster',   game.roster());
							
							debug.val('game', game, 'lib/realtime.js', 201);
						}

						msg = util.format('%s left game %s', handle, gameID);
						debug.msg(msg, 'lib/realtime.js', 205);
					}						

					debug.val('self.sockets', self.sockets, 'lib/realtime.js', 208);
									
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
	}

	// this.logon = function ()

};

// copies all of the EventEmitter properties
Realtime.prototype.__proto__ = events.EventEmitter.prototype;

module.exports = function (adminion, onReady) {

	Adminion = adminion;

	Adminion.realtime = new Realtime();

	Adminion.realtime.on('logon', function (player) {
		Adminion.realtime.players[player['_id']] = player;

		debug.val('Adminion.realtime.players', Adminion.realtime.players, 'lib/realtime.js', 224);
	});

	Adminion.realtime.on('logoff', function (player) {
		delete Adminion.realtime.players[player['_id']];
		debug.val('Adminion.realtime.players', Adminion.realtime.players, 'lib/realtime.js', 229);
	});


	Adminion.realtime.init(onReady);

};