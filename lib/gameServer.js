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
	, sockets = new Object()
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
	passport.use(db.Person.createStrategy());
	// serializeUser() and deserializeUser() return the functions passport will use
	passport.serializeUser(db.Person.serializeUser());
	passport.deserializeUser(db.Person.deserializeUser());

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

	app.get('/', function appGetRoot(request, response) {
//			debug.emit('var' , 'request.session', request.session, 'lib/gameServer.js', 140);
		response.render('root', {
			request : 	request
		});
	});

	// GET requests for /logon will respond with the logon form
	app.get('/logon', function appGetLogon(request, response) {
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
		, function appPostLogon(request, response, next) {
			console.log("[%s] %s logged in.", Date(), request.user.handle);
			return response.redirect(request.body.redir);
		}
	);

	// GET requests for /logoff will kill the users session and redirect to root
	app.get('/logoff', function appGetLogoff(request, response) {
		console.log("[%s] %s logged out.",
			Date(),
			request.user.email);
		request.logOut();
		response.redirect('/');
	});

	////////////////////////////////////////////////////////////////////////
	//
	// PEOPLE
	//
	////////////////////////////////////////////////////////////////////////

	// GET requests for /people will check for auth then display all people
	app.get('/people', ensureAuth, function appGetPeople(request, response) {
		db.Person.find(null, null, {limit: 10}, function(err, people) {
			if (err) { 
				console.trace(err)
				debug.val('err', err, 'lib/gameServer.js', 289);
				response.render('errors/500', {request: request});
			} else {
				response.render('people', {
					people : people,
					request : request
				});
			}
		});
	});

	// get requests
	app.get('/people/create', /* ensureAuth, */ function appGetPeopleCreate(request, response) {
		response.render('people/create', {
			request : 	request
			, err: false
			, redir: request.redir || '/logon'
		});
	});

	app.post('/people', /* ensureAuth, */ function appPostPeople(request, response) {
		// create a new Player instance that we will attempt to create
		var newPlayer = new db.Person({
			email : request.body.email
			, firstName : request.body.firstName
			, lastName : request.body.lastName
			, handle : request.body.handle
		});

		if (request.body.password !== request.body.verifyPassword) {
			response.render('people/create', {
				request : 	request
				, err: 'Passwords do not match!'
				, redir: request.redir || '/logon'
			});
		} else {
			// attempt to register the user via passport-local-mongoose's register plugin
			db.Person.register(newPlayer, request.body.password, function(err, person) {
				if (err) { 
					console.trace(err)
					debug.val('err', err, 'lib/gameServer.js', 329);
					response.render('errors/500', {request: request});
				} else {
					response.redirect('/people/' + person.email);
				}
			});
		}

	});

	// GET requests for /people/:email will check for auth then display the person's profile
	app.get('/people/:email', ensureAuth, function appGetPeopleByEmail(request, response) {
		// find the person requested
		db.Person.findByUsername(request.params.email, function(err, person) {
			// if there is an error, emit 'error' which should kill the page with the error message...?
			if (err) { 
				console.trace(err)
				debug.val('err', err, 'lib/gameServer.js', 346);
				response.render('errors/500', {request: request});
			} else {
				debug.emit('var' , 'person', person, 'lib/gameServer.js', 288);
				response.render('people/person', {
					person : person
					, request : request
				});
			}
		});
	});

	// GET requests for /people/:email/update with check for auth then
	// display a form filled with the user's current data
	app.get('/people/:email/update', ensureAuth, function appGetPeopleByEmailUpdate(request, response) {
		// make sure a person's email has been specified
		if (request.params.email) {
			// if a user was specified, lookup that user, and then....
			db.Person.findByUsername(request.params.email, function(err, person) {
				// if an error occurs, emit the error
				if (err) { 
					console.trace(err)
					debug.val('err', err, 'lib/gameServer.js', 368);
					response.render('errors/500', {request: request});
				} else if (!person) {
					response.render('errors/404', {request: request});
				} else {
					// output the person that we got from the db for debug purposes
	//					debug.val( 'person', person, 'lib/gameServer.js', 242);
					// render people/update.jade
					response.render('people/update', {
						person: person
						, request : request
					});
				}
			});
		// if no user was specified...
		} else {
			// redirect to /people
			response.redirect('/people');
		}
	});

	app.post('/people/:email/update', ensureAuth, function appPostPeopleByEmailUpdate(request, response) {
		// make sure a person's email has been specified
		if (request.params.email) {
			// define updated person
			updatedPlayer = {
				firstName: request.body.firstName
				, lastName: request.body.lastName
				, handle: request.body.handle
			};

			// find the existing person, then when finished....
			db.Person.findByUsername(request.params.email, function(err, person) {
				// if there is an error finding this user
				if (err) { 
					console.trace(err)
					debug.val('err', err, 'lib/gameServer.js', 404);
					response.render('errors/500', {request: request});
				} else {

					// update the person as defined, then...
					person.update(updatedPlayer, function(err, numberAffected, raw) {
						// emit err, if any
						if (err) { 
							console.trace(err)
							debug.val('err', err, 'lib/gameServer.js', 413);
							response.render('errors/500', {request: request});
						} else {

							// verify that one and only one document was affected
							if (numberAffected !== 1) {
								// if both the password and verify password fields are set...
								if (request.body.password && request.body.verifyPassword) {
									// and if the password and verify password fields are equal...
									if (request.body.password === request.body.verifyPassword) {
										// update the person's password, then...
										person.setPassword(request.body.password, function(error){
											// make sure there was no error
											if (err) { 
												console.trace(err)
												debug.val('err', err, 'lib/gameServer.js', 428);
												response.render('errors/500', {request: request});
											} else {
												// save the password changes
												person.save(function(error){
													// if there was an error
													if (err) { 
														console.trace(err)
														debug.val('err', err, 'lib/gameServer.js', 436);
														response.render('errors/500', {request: request});
													} else {
														console.log('person updated!');
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

					response.redirect('/people/' + person.email);
				}
			});
		// if no user was specified...
		} else {
			// redirect to /people
			response.redirect('/people');
		}
	});

	////////////////////////////////////////////////////////////////////////
	//
	// GAMES
	//
	////////////////////////////////////////////////////////////////////////

	// GET requests for /games will authenticate then display list of games in play
	app.get('/games', ensureAuth, function appGetGames(request, response) {

		db.Game.where('status').equals('lobby').limit(20).exec(function(err, games) {
			if (err) { 
				console.trace(err)
				debug.val('err', err, 'lib/gameServer.js', 473);
				response.render('errors/500', {request: request});
			} else if (!games) {
				response.render('errors/404', {request: request});
			}  else {
				debug.val('sockets', sockets, 'lib/gameServer.js', 479);
				debug.val('games', games, 'lib/gameServer.js', 480)

				response.render('games' , {
					games: games
					, request : request
				});
			}
		});
	});

	// GET requests for /games/create will authenticate, then display the form to create a game
	app.get('/games/create', ensureAuth, function appGetGamesCreate(request, response) {
		response.render('games/create', {request : request});
	});

	// GET requests for /games/:game will authenticate, then display game stats
	app.get('/games/:gameID', ensureAuth, function appGetGamesByGameId(request, response) {
		//debug.val('mongoStore', mongoStore, 'lib/gameServer.js', 457);

		db.Game.findById(request.params.gameID, function(err, game) {
			if (err) { 
				console.trace(err)
				debug.val('err', err, 'lib/gameServer.js', 501);
				response.render('errors/500', {request: request});
			} else if (!game) {
				response.render('errors/404', {request: request});
			}  else {
				response.render('games/game', {
					game: game
					, request: request
				});
			}
		});
	});

	// GET requests for /lobby will display the game lobby if authorized
	app.get('/games/:gameID/lobby', ensureAuth, function appGetGamesByGameIdLobby(request, response) {		
		db.Game.findById(request.params.gameID, function(err, game) {
			if (err) { 
				console.trace(err)
				debug.val('err', err, 'lib/gameServer.js', 519);
				response.render('errors/500', {request: request});
			} else if (!game) {
				response.render('errors/404', {request: request});
			} else {
				// response.on('disconnect', function() { ... });

				// now render the page 
				response.render('games/lobby', {
					game: game
					, request : request
				});
			}
		});
	});

	// GET requests for /play will check for authorization then display the game
	app.get('/games/:gameID/play', ensureAuth, function appGetGamesByGameIdPlay(request, response) {
		response.render('games/play', { request : request});
	});

	// GET requests for /spectate will check for authorization
	app.get('/games/:gameID/spectate', ensureAuth, function appGetGamesByGameIdSpectate(request, response) {
		response.render('games/spectate', {request: request});
	});

	// POST requests for /games will authenticate then create a new game instance
	app.post('/games', ensureAuth, function appPostGames(request, response) {

		// debug.val( 'request.user', request.user, 'lib/gamesServer.js', 457);

		// create Game model instance
		var newGame = new db.Game({
			name : request.body.name
			, playerOne : { 
				handle: 		request.user.handle
				, playerID: 	request.user['_id']
				, sessionID: 	request.sessionID
			}
		});

		// save the new game to db
		newGame.save(function(err) {
			if (err) { 
				console.trace(err);
				debug.val('err', err, 'lib/gameServer.js', 566);
				response.render('errors/500', {request: request});
			} else {
				// create a new container for sockets that join this game
				sockets[newGame['_id']] = {};

				debug.val('newGame', newGame, 'lib/gameServer.js', 570);

				response.redirect('/games/' + newGame['_id'] + '/lobby');	
			}
		});
	});

	// create a server instance depending on the boolean conversion of config.http
	server = !!config.https
		// if https is enabled, create https server
		? https.createServer(config.https.data, app )
		// otherwise, create http server
		: http.createServer(app);
			
	server.listen(config.port, function() { adminion.emit('expressReady'); });

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
	 * 	function onConnection(socket)
	 *	
	 * Called each time a socket connects to the socket server.
	 */
	io.sockets.on('connection', function onConnection(socket) {
		debug.msg('------------------------------ socket connect ----------------------------------', 'lib/gameServer', 619);
		debug.val( 'sockets', sockets, 'lib/gameServer', 620);

		var playerID = socket.handshake.user['_id']
			, handle = socket.handshake.user.handle;

		/**
		 *	function onJoin(gameID)
		 * 
		 * When a socket attempts to enter a game lobby
		 */
		socket.on('enterLobby', function onEnterLobby(gameID) {
			var seatsRemaining;

			// debug.val('gameID', gameID, 'lib/gameServer.js', 632);

			if (gameID === undefined) {
				debug.val('gameID', gameID, 'lib/gameServer.js', 636);
				// handle error
				return;
			}

			// retrieve the requested game from mongodb
			db.Game.findOne({ "_id" : gameID }, function(err, game) {
				// if there's an error
				if (err) { 
					// print stack trace and kill the process
					console.trace(err)
					debug.val('err', err, 'lib/gameServer.js', 647);
					process.exit();

				// if there is no error
				} else if (!game) {
					console.trace('game not found');
					debug.msg('game not found', 'lib/gameServer.js', 653);
					// handle no game found. I hate 404, redirect to /games is cleaner
				} else {


					// attempt to enter the game lobby
					var playerNum = game.enterLobby(socket);

					debug.val('playerNum', playerNum, 'lib/gameServer.js', 661);

					// if player was allowed to enter
					if (playerNum > -1) {
						debug.msg(handle + ' was allowed to enter the game.', 'lib/gameServer', 666);

						db.Game.update({ "_id" : game["_id"]}
							, { $set : { players : game.players} }
							, function (err, numberAffected, raw) {

							// if there's an error
							if (err) { 
								// print stack trace and kill the process
								console.trace(err)
								debug.val('err', err, 'lib/gameServer.js', 673);
								process.exit();
							} 

							// if no sockets for this player have been saved, create an empty socket list
							if (!sockets[gameID]) {
								sockets[gameID] = {};
							} 

							if (!sockets[gameID][playerID]) {
								sockets[gameID][playerID] = {};
							}
								
							// add the socket to list of player's sockets.
							// this allows for multiple windows in the same 
							// browser session with the same user if someone 
							// wants to do that for some reason.
							sockets[gameID][playerID][socket.id] = { 
								socket: 		socket
								// also add the gameID and sessionID for lookup/comparison
								, gameID: 		gameID
								, sessionID: 	socket.sessionID
							};

							debug.val('sockets', sockets, 'lib/adminion', 699);
							debug.val('game.players',game.players, 'lib/gameServer.js', 700);

							// assign event handler for "ready!" event
							socket.on('ready!', function onReady(value) {
								game.players[playerNum].ready = value;
								game.save(function(err) {
									if (err) {// print stack trace and kill the process
										console.trace(err)
										debug.val('err', err, 'lib/gameServer.js', 708);
										process.exit();
									}
									msg = 'player ' + playerNum + ' ' + (value) ? 'is' : 'is not' + ' ready.';

									debug.msg(msg, 'lib/gameServer.js', 713);
								})
							});

							debug.msg(util.format('%s entered game lobby %s', handle, gameID),
								'lib/gameServer.js', 718);
							
							// join the socket to the chat room "gameID"
							socket.join(gameID);

							// greet the new player 
							socket.emit('msg', "Welcome, " + handle + "!");

							// tell all the other players that the new player entered the lobby
							socket.broadcast.emit('entered', handle);
							io.sockets.in(gameID).emit('roster', game.players);

							
						});
					} else {
						var err = 'the server denied the connection request.';
						console.trace(err)
						debug.val('err', err, 'lib/gameServer.js', 735);
						socket.emit('denied', err);
						socket.disconnect();
						
					}
				}
			})
		});

		/**
		 *	function onDisconnect(socket)
		 *
		 * When a socket disconnects from 
		 */
		socket.on('disconnect', function onDisconnect() {
			debug.msg('---------------------------- socket disconnect ---------------------------------', 'lib/gameServer', 706);

			debug.val('socket.handshake', socket.handshake, 'lib/gameServer.js', 754);
			debug.val('sockets', sockets, 'lib/gameServer.js', 755);

			var handshake = socket.handshake;

			var url = handshake.headers.referer.split('/');

			// var protocol = 'https:'; //url[0];
			// var address = url[2];
			// var host = url[2].split(':')[0];
			// var port = url[2].split(':')[1];
			// var directory = url[3];
			var gameID = url[4];

			debug.val('gameID', gameID, 'lib/gameServer.js', 768);			

			var playerID = socket.handshake.user['_id'];
			var handle = socket.handshake.user.handle;

			if (!!gameID) {
				// retrieve the requested game from mongodb
				db.Game.findById(gameID, function(err, game) {
					// if there's an error
					if (err) { 
						// print stack trace and render 500
						console.trace(err)
						debug.val('err', err, 'lib/gameServer.js', 773);
						process.exit();

					// if there is no error
					} else if (!game) {
						console.trace('game not found');
						debug.msg('game not found', 'lib/gameServer.js', 779);
						// handle no game found. I hate 404, redirect to /games is cleaner
					} else {	
						// say goodbye to the player 
						socket.emit('msg', "Fairwell, " + socket.id + "!");

						if (sockets[gameID] && sockets[gameID][playerID] && sockets[gameID][playerID][socket.id] ) {
							delete sockets[gameID][playerID][socket.id];
							// if the player has no more sockets
							if (Object.keys(sockets[gameID][playerID]).length === 0) {

								// the player has left the lobby
								game.exitLobby(handshake);

								game.save(function (err) {
									
									if (err) { 
										// print stack trace and render 500
										console.trace(err)
										debug.val('err', err, 'lib/gameServer.js', 800);
										process.exit();

									} 

									// let all the sockets know that the user has left the lobby
									io.sockets.in(gameID).emit('exited', handle);

									// now let them all know the new roster
									io.sockets.in(gameID).emit('roster',   game.players);
									
									debug.val('game', game, 'lib/gameServer.js', 810);
								});

							}

							msg = util.format('%s left game %s', handle, gameID);
							debug.msg(msg, 'lib/gameServer.js', 819);
						}						

						debug.val('sockets', sockets, 'lib/gameServer.js', 816);
					}
				});				
			}
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

// debug.val( 'adminion', adminion, 'lib/gameServer.js', 501);
