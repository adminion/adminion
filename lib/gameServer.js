
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
	, MongoStore = require('connect-mongo')(express)
	, passport = require('passport')
	, passportSocketIo = require('passport.socketio')
	, socketio = require('socket.io');

// adminion library modules
var app = express()
	, config = require('./config')
	, db = require('./db')
	, env = require('./env')
	, hanlders = require('./')
	, io = null
	, server = null;

var adminion;

// so javscript sucks at comparing objects, but is okay with JSON
function areEqual(a, b) {
	// convert the objets to JSON, then compare them, return true/false
	return !!(JSON.stringify(a) === JSON.stringify(b));
}

// adminion constructor
function AdminionServer() {

	events.EventEmitter.call(this);

	////////////////////////////////////////////////////////////////////////////
	// module methods
	////////////////////////////////////////////////////////////////////////////

	// public method for starting game server
	this.Start = function () {
		// console.log('Starting AdminionServer...');
		this.emit('serverStart');
	};

	////////////////////////////////////////////////////////////////////////////

};


// database initializer
function dbInit() {
	console.log('Initializing database...');
	// get the db module
	db.once('ready', function() { adminion.emit('dbReady'); });
	db.connect();
};

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

/**
 *	adminion.ensureAuth(request, response, next)

 * Authentication middleware used to ensure users are authorized to access
 * the requested resource
 *
 */

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
		redirectURL = util.format('/Logon?redir=%s&err=%s',
			request.url,
			'You need to logon before you can visit ' + request.url
		);
		response.redirect(redirectURL);
	}
};

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
				app.use(express.session({
					cookie : 	config.session.cookie
					, secret: 	config.session.secret
					, store:	new MongoStore({ mongoose_connection: db.connection})
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
			err: request.flash('error')
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
			if (err) { expressErrorHandler(500, err, request, response); }
			response.render('players', {
				players : players,
				request : request
			});
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
				if (err) { expressErrorHandler(500, err, request, response); }
				response.redirect('/players/' + player.email);
			});
		}

	});

	// GET requests for /players/:email will check for auth then display the player's profile
	app.get('/players/:email', ensureAuth, function(request, response) {
		// find the player requested
		db.Player.findByUsername(request.params.email, function(err, player) {
			// if there is an error, emit 'error' which should kill the page with the error message...?
			if (err) { expressErrorHandler(500, err, request, response); }
			debug.emit('var' , 'player', player, 'lib/gameServer.js', 288);
			response.render('players/player', {
				player : player
				, request : request
			});
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
				if (err) { expressErrorHandler(500, err, request, response); }
				// output the player that we got from the db for debug purposes
//					debug.emit('var', 'player', player, 'lib/gameServer.js', 242);
				// render players/update.jade
				response.render('players/update', {
					player: player
					, request : request
				});
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
				if (err) { expressErrorHandler(500, err, request, response); }

				// update the player as defined, then...
				player.update(updatedPlayer, function(err, numberAffected, raw) {
					// emit err, if any
					if (err) { expressErrorHandler(500, err, request, response); }

					// verify that one and only one document was affected
					if (numberAffected !== 1) {
						// if both the password and verify password fields are set...
						if (request.body.password && request.body.verifyPassword) {
							// and if the password and verify password fields are equal...
							if (request.body.password === request.body.verifyPassword) {
								// update the player's password, then...
								player.setPassword(request.body.password, function(error){
									// make sure there was no error
									if (!error) {
						// save the password changes
										player.save(function(error){
											// if there was an error
											if (error) {
												// output to the console..
												console.log(error)
											}
										});
									} else {
										// output to console
										console.log(error)
									}
								});
							}
						}
					} else {
						request.session.error = 'Error, '
					}
				});
				response.redirect('/players/' + player.email);
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
			if (err) { expressErrorHandler(500, err, request, response); }
//				debug.emit('var');
			response.render('games', {
				games: games
				, request : request
			});
		});
	});

	// GET requests for /games/create will authenticate, then display the form to create a game
	app.get('/games/create', ensureAuth, function(request, response) {
		response.render('games/create', {request : request});
	});

	// GET requests for /games/:game will authenticate, then display game stats
	app.get('/games/:gameId', ensureAuth, function(request, response) {
		db.Game.findById(request.params.gameId, function(err, game) {
			if (err) { 
				response.status(500);
		
				var msg = util.format('%s: 500 - I fucked up -> %s',
					new Date(),
					request.body.url
				);
				console.log(msg);
				console.trace();
				res.render('errors/500', {request: request.body});
			}

			response.render('games/game', {
				game: game
				, request: request
			});
		});
	});

	// GET requests for /lobby will display the game lobby if authorized
	app.get('/games/:gameId/lobby', ensureAuth, function(request, response) {
		// debug.emit('var', 'request', request, 'lib/gamesServer.js', 411);
		
		// var currentUser = {
		// 	email: request.user.email
		// 	, sid: request.cookies['connect.sid']
		// };
		
		db.Game.findById(request.params.gameId, function(err, game) {
			if (err) { 
				response.status(500);
		
				var msg = util.format('%s: 500 - I fucked up -> %s',
					new Date(),
					request.body.url
				);
				console.log(msg);
				console.trace();
				res.render('errors/500', {request: request.body});
			}

			// // if there is still an empty seat
			// if (game.players.length < game.config.numPlayers) {
			// 	// check to see if we have already joined the game...
			// 	var found = false;
			// 	for (var i = 0; i < game.players.length; i+=1) {
			// 		found = areEqual(currentUser, game.players[i]);
			// 	}
				
			// 	if (found === false) {
			// 		game.players.addToSet(currentUser);
			// 		game.save(function(err) {
			// 			if (err) { 
			// 				throw err;
			// 			} else {
			// 				console.log('%s joined game %s', request.user.email, game['_id']);
			// 			}
			// 		});
					
			// 	} 

				// now render the page 
				response.render('games/lobby', {
					game: game
					, request : request
				});
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

		debug.emit('var', 'request.session', request.session, 'lib/gamesServer.js', 457);
		// crate Game model instance
		var newGame = new db.Game({
			name : request.body.name
			, players : [ {
				email : request.user.email
				, sid : request.cookies['connect.sid']
			}]
			, log : { start : new Date() }
		});

		newGame.save(function(err) {
			if (err) { expressErrorHandler(500, err, request, response); }
			response.redirect('/games/' + newGame['_id']);
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

function realtimeInit() {
	console.log('Initializing realtime subsystem...');
	
	var sockets = [];
	io = socketio.listen(server);
	
	io.sockets.on('connection', function(socket) {
		// console.log(socket);
		console.log(socket.id + ' connected');

		// greet the new socket 00
		socket.emit('msg', "Welcome, " + socket.id);

		// add the socket to list of sockets
		console.log(sockets);
		sockets.push(socket.id);
		console.log(sockets);
		
		
		socket.on('disconnect', function(gameId) {
			console.log(sockets);
			// remove the socket from the array when it disconnects
			var index = sockets.indexOf(socket.id);
			sockets.splice(index, 1);
			console.log(sockets);
		});

		// when the user wants to enter a game lobby
		socket.on('lobby', function(gameId) {
			// join the game room
			socket.join('gameId');
			// tell everyone in the room that the new socket entered
			io.sockets.emit('msg', socket.id + ' entered lobby of game ' + gameId +'.');
			console.log(socket);

		});

		socket.on('msg', function(msg) {
			console.log(socket.id + ": " + msg);
			socket.broadcast.emit('msg',socket.id + ": " + msg);
		});

		
	});

	adminion.emit('realtimeReady');
};

function serverListening() {
	console.log("listening --> %s", env.url());
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

// debug.emit('var', 'adminion', adminion, 'lib/gameServer.js', 501);
