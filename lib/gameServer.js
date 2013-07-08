
/**
 * Configure the main adminion library and module.exports equal to it
 */

// core modules
var assert = require('assert')
	, events = require('events')
	, http = require('http')
	, https = require('https')
	, url = require('url')
	, util = require('util');

// 3rd party modules
var express = require('express')
	, flash = require('connect-flash')
	, connectMongo = require('connect-mongo')(express)
	, passport = require('passport')
	, passportSocketIo = require('passport.socketio')
	, socketio = require('socket.io');

// adminion library modules
var config = require('./config')
	, db = require('./db')
	, env = require('./env')
	, Roster = require('./roster');

// module initialization
var adminion = undefined
	, app = express()
	, games = []
	, sockets = []
	, io = undefined
	, mongoStore = undefined
	, server = undefined;

// so javscript sucks at comparing objects, but is okay with JSON
function areEqual(a, b) {
	// convert the objets to JSON, then compare them, return true/false
	return !!(JSON.stringify(a) === JSON.stringify(b));
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////
////	A D M I N I O N   S E R V E R
////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function AdminionServer() {

	events.EventEmitter.call(this);

	// public method for starting game server
	this.Start = function () {
		// console.log('Starting AdminionServer...');
		this.emit('serverStart');
	};
};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////
////	D B   I N I T
////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function dbInit() {
	console.log('Initializing database...');
	// get the db module
	db.once('ready', function() { adminion.emit('dbReady'); });
	db.connect();
};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////
////	A U T H   I N I T
////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function authInit() {
	console.log('Initializing authorization subsystem...');
	// createStrategy() returns the pre-built strategy
	passport.use(db.Player.createStrategy());
	// serializeUser() and deserializeUser() return the functions passport will use
	passport.serializeUser(db.Player.serializeUser());
	passport.deserializeUser(db.Player.deserializeUser());

	// signal that auth tools are ready
	adminion.emit('authReady');
};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////
////	E N S U R E   A U T H
////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function ensureAuth(request, response, next) {
	var redirectURL;

	console.log('%s - Authorizaton required...', request.url);
//		debug.emit('var' , 'request.session', request.session, 'lib/gameServer.js', 332);
	// this is a pretty crude way of doing this but it works at this scale;
	// however, it would be a silly performance loss to do this every single time...
	if (request.isAuthenticated()) {
		console.log('\t--> %s is authorized', request.user.email);
		return next();
	} else {
		console.log('\t--> NOT authenticated.  redirecting to logon...');
		redirectURL = util.format('/Logon?redir=%s', request.url);
		request.cookies.err = 'You need to logon before you can visit ' + request.url;
		response.redirect(redirectURL);
	}
};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////
////	E X P R E S S   C O N F I G U R E
////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function expressConfigure(environment) {
	switch(environment) {
		case 'dev':
			return function() {
				app.use(express.errorHandler({
					dumpExceptions: true,
					showStack: true
				}));
			};

			break;

		case 'prod':
			return function() {
				app.use(express.logger('prod'));
			};

			break;

		default: 
			return function() { 
				app.set('port', config.port);
				app.set('views', config.views);
				app.set('view engine', config.viewEngine);
				app.use(express.favicon(config.favicon));
				app.use(express.logger('short'));

				// for PUT requests
				app.use(express.bodyParser());
				app.use(express.methodOverride());

				// sets up session store in memory also using cookies
				app.use(express.cookieParser());

				mongoStore = new connectMongo({ mongoose_connection: db.connection});

				app.use(express.session({
					cookie : 	config.session.cookie
					, key : 'adminion.sid'
					, secret: 	config.session.secret
					, store:	mongoStore
				}));

				// allows us to use connect-flash messages
				app.use(flash());

				// setup passport
				app.use(passport.initialize());
				app.use(passport.session());

				// have express try our routes (not yet defined) before looking for static content
				app.use(app.router);

				// serve static content if no routes were found
				app.use(express.static('public'));

				// error handler should be last resort
			//	app.use(function(err, req, res, next){
			//		res.status(404);
			//
			//		console.log('%s: 404 - Not Found -> %s',
			//			new Date(),
			//			req.body.url
			//		);
			//		res.render('errors/404', {request: req.body});
			//	});
			};

			break;
	}

	

};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////
////	E X P R E S S    I N I T
////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


function expressInit() {
	console.log('Initializing webserver...')

	//when NODE_ENV is undefined
	app.configure(expressConfigure());

	//when NODE_ENV = 'development'
	app.configure(expressConfigure('dev'));

	//when NODE_ENV = 'production'
	app.configure(expressConfigure('prod'));

	// make the properties adminion object available as variables in all views
	app.locals = {
		adminion : {
			env: env
		}
		, config : config.locals
	};

	////////////////////////////////////////////////////////////////////////
	//
	// REQUEST HANDLERS
	//
	////////////////////////////////////////////////////////////////////////

	app.get('/', function(request, response) {
//			debug.emit('var' , 'request.session', request.session, 'lib/gameServer.js', 140);
		response.render('root', {
			request : 	request
		});
	});

	// GET requests for /logon will respond with the logon form
	app.get('/logon', function(request, response) {
		response.render('logon', {
			err: request.flash('error') || request.cookies.err
			, redir: url.parse(request.url,true).query.redir || '/'
			, request : 	request
		});
	});

	// POST requests for /logon will attempt to authenticate the given user
	app.post('/logon',
		// first authenticate
		passport.authenticate('local', { failureRedirect: '/logon', failureFlash: true })

		// then fulfill the request
		, function (request, response, next) {
			console.log("[%s] %s logged in.", Date(), request.user.handle);
			return response.redirect(request.body.redir);
		}
	);

	// GET requests for /logoff will kill the users session and redirect to root
	app.get('/logoff', function(request, response) {
		console.log("[%s] %s logged out.",
			Date(),
			request.user.email);
		request.logOut();
		response.redirect('/');
	});

	////////////////////////////////////////////////////////////////////////
	//
	// PLAYERS
	//
	////////////////////////////////////////////////////////////////////////

	// GET requests for /players will check for auth then display all players
	app.get('/players', ensureAuth, function(request, response) {
		db.Player.find(null, null, {limit: 10}, function(err, players) {
			if (err) { 
				console.trace(err)
				console.log(err);
				response.render('errors/500', {request: request});
			} else {
				response.render('players', {
					players : players,
					request : request
				});
			}
		});
	});

	// get requests
	app.get('/players/create', /* ensureAuth, */ function(request, response) {
		response.render('players/create', {
			request : 	request
			, err: false
			, redir: request.redir || '/logon'
		});
	});

	app.post('/players', /* ensureAuth, */ function(request, response) {
		// create a new Player instance that we will attempt to create
		var newPlayer = new db.Player({
			email : request.body.email
			, firstName : request.body.firstName
			, lastName : request.body.lastName
			, handle : request.body.handle
		});

		if (request.body.password !== request.body.verifyPassword) {
			response.render('players/create', {
				request : 	request
				, err: 'Passwords do not match!'
				, redir: request.redir || '/logon'
			});
		} else {
			// attempt to register the user via passport-local-mongoose's register plugin
			db.Player.register(newPlayer, request.body.password, function(err, player) {
				if (err) { 
					console.trace(err)
					console.log(err);
					response.render('errors/500', {request: request});
				} else {
					response.redirect('/players/' + player.email);
				}
			});
		}

	});

	// GET requests for /players/:email will check for auth then display the player's profile
	app.get('/players/:email', ensureAuth, function(request, response) {
		// find the player requested
		db.Player.findByUsername(request.params.email, function(err, player) {
			// if there is an error, emit 'error' which should kill the page with the error message...?
			if (err) { 
				console.trace(err)
				console.log(err);
				response.render('errors/500', {request: request});
			} else {
				debug.emit('var' , 'player', player, 'lib/gameServer.js', 288);
				response.render('players/player', {
					player : player
					, request : request
				});
			}
		});
	});

	// GET requests for /players/:email/update with check for auth then
	// display a form filled with the user's current data
	app.get('/players/:email/update', ensureAuth, function(request, response) {
		// make sure a player's email has been specified
		if (request.params.email) {
			// if a user was specified, lookup that user, and then....
			db.Player.findByUsername(request.params.email, function(err, player) {
				// if an error occurs, emit the error
				if (err) { 
					console.trace(err)
					console.log(err);
					response.render('errors/500', {request: request});
				} else {
					// output the player that we got from the db for debug purposes
	//					debug.vars( 'player', player, 'lib/gameServer.js', 242);
					// render players/update.jade
					response.render('players/update', {
						player: player
						, request : request
					});
				}
			});
		// if no user was specified...
		} else {
			// redirect to /players
			response.redirect('/players');
		}
	});

	app.post('/players/:email/update', ensureAuth, function(request, response) {
		// make sure a player's email has been specified
		if (request.params.email) {
			// define updated player
			updatedPlayer = {
				firstName: request.body.firstName
				, lastName: request.body.lastName
				, handle: request.body.handle
			};

			// find the existing player, then when finished....
			db.Player.findByUsername(request.params.email, function(err, player) {
				// if there is an error finding this user
				if (err) { 
					console.trace(err)
					console.log(err);
					response.render('errors/500', {request: request});
				} else {

					// update the player as defined, then...
					player.update(updatedPlayer, function(err, numberAffected, raw) {
						// emit err, if any
						if (err) { 
							console.trace(err)
							console.log(err);
							response.render('errors/500', {request: request});
						} else {

							// verify that one and only one document was affected
							if (numberAffected !== 1) {
								// if both the password and verify password fields are set...
								if (request.body.password && request.body.verifyPassword) {
									// and if the password and verify password fields are equal...
									if (request.body.password === request.body.verifyPassword) {
										// update the player's password, then...
										player.setPassword(request.body.password, function(error){
											// make sure there was no error
											if (err) { 
												console.trace(err)
												console.log(err);
												response.render('errors/500', {request: request});
											} else {
												// save the password changes
												player.save(function(error){
													// if there was an error
													if (err) { 
														console.trace(err)
														console.log(err);
														response.render('errors/500', {request: request});
													} else {
														console.log('player updated!');
													}
												});
											} 
										});
									}
								}
							} else {
								request.session.error = 'Error, '
							}
						}
					});

					response.redirect('/players/' + player.email);
				}
			});
		// if no user was specified...
		} else {
			// redirect to /players
			response.redirect('/players');
		}
	});

	////////////////////////////////////////////////////////////////////////
	//
	// GAMES
	//
	////////////////////////////////////////////////////////////////////////

	// GET requests for /games will authenticate then display list of games in play
	app.get('/games', ensureAuth, function(request, response) {
		db.Game.find(null, null, {limit: 20}, function(err, games) {
			if (err) { 
				console.trace(err)
				console.log(err);
				response.render('errors/500', {request: request});
			} else {
	//				debug.emit('var');
				response.render('games', {
					games: games
					, request : request
				});
			}
		});
	});

	// GET requests for /games/create will authenticate, then display the form to create a game
	app.get('/games/create', ensureAuth, function(request, response) {
		response.render('games/create', {request : request});
	});

	// GET requests for /games/:game will authenticate, then display game stats
	app.get('/games/:gameId', ensureAuth, function(request, response) {
		//debug.vars('mongoStore', mongoStore, 'lib/gameServer.js', 457);

		db.Game.findById(request.params.gameId, function(err, game) {
			if (err) { 
				console.trace(err)
				console.log(err);
				response.render('errors/500', {request: request});
			}

			if (game !== undefined) {
				response.render('games/game', {
					game: game
					, request: request
				});
			}  else {
				response.render('errors/404', {request: request});
			}
		});
	});

	// GET requests for /lobby will display the game lobby if authorized
	app.get('/games/:gameId/lobby', ensureAuth, function(request, response) {		
		db.Game.findById(request.params.gameId, function(err, game) {
			if (err) { 
				console.trace(err)
				console.log(err);
				response.render('errors/500', {request: request});
			} else {
				// now render the page 
				response.render('games/lobby', {
					game: game
					, request : request
				});
			}
			// }
		});
	});

	// GET requests for /play will check for authorization then display the game
	app.get('/games/:gameId/play', ensureAuth, function(request, response) {
		response.render('games/play', { request : request});
	});

	// GET requests for /spectate will check for authorization
	app.get('/games/:gameId/spectate', ensureAuth, function(request, response) {
		response.render('games/spectate', {request: request});
	});

	// POST requests for /games will authenticate then create a new game instance
	app.post('/games', ensureAuth, function(request, response) {

		debug.vars( 'request.session', request.session, 'lib/gamesServer.js', 457);

		// create Game model instance
		var newGame = new db.Game({
			name : request.body.name
			, playerOne : { 
				playerID: 	request.user['_id'],
				sessionID: 	request.sessionID
			}
			, log : { start : new Date() }
		});

		// save the new game to db
		newGame.save(function(err) {
			if (err) { 
				console.trace(err)
				console.log(err);
				response.render('errors/500', {request: request});
			} else {
				response.redirect('/games/' + newGame['_id']);
			}
		});

	});

	// if https was enabled in the config
	if (config.https) {
		// create https server instance, then listen!
		server = https.createServer(config.https.data, app )
			.listen(config.port, function() { adminion.emit('expressReady'); });
	} else {
		// create http server instance, then listen!
		server = http.createServer(app)
			.listen(config.port, function() { adminion.emit('expressReady'); });
	}

};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////
////	R E A L - T I M E   I N I T
////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function realtimeInit() {
	console.log('Initializing realtime subsystem...');

	var sockets = [];

	io = socketio.listen(server);

	////////////////////////////////////////////////////////////////////////
	//
	// 	A U T H O R I Z A T I O N
	//
	////////////////////////////////////////////////////////////////////////

	io.set("authorization", passportSocketIo.authorize({
		cookieParser: 	express.cookieParser
		, key: 			'adminion.sid'
		, secret: 		config.session.secret
		, store: 		mongoStore
	}));
	
	/**
	 * 	function socketsOnConnection(socket)
	 *	
	 * Called each time a socket connects to the socket server.
	 */
	io.sockets.on('connection', function onConnection(socket) {
		// console.log(player);
		debug.vars( 'socket.handshake', socket.handshake, 'lib/adminion', 621);

		/**
		 *	function socketOnJoin(gameId)
		 * 
		 * When a socket attempts to join a game
		 */
		socket.on('join', function onJoin(gameId) {
			var seatsRemaining;

			// debug.vars('gameId', gameId, 'lib/gameServer.js', 632);

			if (gameId === undefined) {
				debug.vars('gameId', gameId, 'lib/gameServer.js', 634);
				// handle error
				return;
			}

			// retrieve the requested game from mongodb
			db.Game.findById(gameId, function(err, game) {
				// if there's an error
				if (err) { 
					// print stack trace and render 500
					console.trace(err)
					console.log(err);
					process.exit();

				// if there is no error
				} else if (!game) {
					console.trace('game not found');
					debug.msg('game not found', 'lib/gameServer.js', 652);
					// handle no game found. I hate 404, redirect to /games is cleaner
				} else {

					// debug.vars('game', game, 'lib/gameServer.js', 601);

					// check to see if game roster exists
					if (!games[gameId]) {
						// if not, create a new Roster
						games[gameId] = new Roster(gameId, game.playerOne, game.config.maxFriends);

						/**
						 * 	function gameOnFriendsReady(Boolean value)
						 *
						 * Notify playerOne when all friends are ready.
						 */
						games[gameId].on('ready', function onFriendsReady(value) {
							games[gameId].playerOne.emit('friends_ready', value);
						});
					}
					
					seatsRemaining = games[gameId].add(socket);

					// if the socket is added successfully
					if (seatsRemaining) {
						socket.set('gameId', gameId, function() {
							console.log('%s joined game %s', socket.handshake.user.handle, gameId);
							// debug.vars('socket',socket, 'lib/gameServer', 682);
						});

					}
				}
			})
		});

		/**
		 *	function socketOnDisconnect(socket)
		 *
		 * When a socket disconnects from 
		 */
		socket.on('disconnect', function onDisconnect() {
			// debug.vars('socket',socket, 'lib/gameServer', 695);
			
			socket.get('gameId', function(gameId) {
				// remove the socket from the lobby, if they're in there
				if (games[gameId]) {
					games[gameId].remove(socket.id);
				}
				// debug.vars('games[' + gameId + ']', games[gameId], 'lib/gameServer.js', 701);
			});
		});

		socket.on('msg', function onMsg(msg) {
			console.log(socket.id + ": " + msg);
			socket.broadcast.emit('msg', socket.id + ": " + msg);
		});
	});

	adminion.emit('realtimeReady');
};

function serverListening() {
	console.log("\nAdminion Game Server listening --> %s\n", env.url());
	adminion.emit('listening');
};

// Copies all of the EventEmitter properties
AdminionServer.prototype.__proto__ = events.EventEmitter.prototype;

adminion = new AdminionServer();

adminion.once('serverStart', dbInit);
adminion.once('dbReady', authInit)
adminion.once('authReady', expressInit);
adminion.once('expressReady', realtimeInit);
adminion.once('realtimeReady', serverListening);

module.exports = adminion;

// debug.vars( 'adminion', adminion, 'lib/gameServer.js', 501);
