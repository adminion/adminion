
// node core modules

var http = require('http')
	, https = require('https')
	, url = require('url');

// 3rd party modules
var express = require('express')
	, flash = require('connect-flash')
	, connectMongo = require('connect-mongo')(express);

var Adminion
	, app;

// define the Adminion http constructor
function HTTP() {

	var self = this;

	this.init = function(onReady) {
		app = express();

		//when NODE_ENV is undefined
		app.configure(function () { 
			app.set('port', Adminion.config.port);
			app.set('views', Adminion.config.views);
			app.set('view engine', Adminion.config.viewEngine);
			app.use(express.favicon(Adminion.config.favicon));
			app.use(express.logger('short'));

			// for PUT requests
			app.use(express.bodyParser());
			app.use(express.methodOverride());

			// sets up session store in memory also using cookies
			app.use(express.cookieParser());

			mongoStore = new connectMongo({ mongoose_connection: Adminion.db.connection});

			app.use(express.session({
				cookie : 	Adminion.config.session.cookie
				, key : 'adminion.sid'
				, secret: 	Adminion.config.session.secret
				, store:	mongoStore
			}));

			// allows us to use connect-flash messages
			app.use(flash());

			// setup passport
			app.use(Adminion.auth.passport.initialize());
			app.use(Adminion.auth.passport.session());

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
		});

		//when NODE_ENV = 'development'
		app.configure(function () {
			app.use(express.errorHandler({
				dumpExceptions: true,
				showStack: true
			}));
		});

		//when NODE_ENV = 'production'
		app.configure(function () {
			app.use(express.logger('prod'));
		});

		// make the properties Adminion object available as variables in all views
		app.locals = {
			adminion : {
				env: Adminion.env
			}
			, config : Adminion.config.locals
		};

		////////////////////////////////////////////////////////////////////////
		//
		// REQUEST HANDLERS
		//
		////////////////////////////////////////////////////////////////////////

		app.get('/', function (request, response) {
	//			debug.emit('var' , 'request.session', request.session, 'lib/http.js', 140);
			response.render('root', {
				request : 	request
			});
		});

		// GET requests for /logon will respond with the logon form
		app.get('/logon', function (request, response) {
			response.render('logon', {
				err: request.flash('error') || request.cookies.err
				, redir: url.parse(request.url,true).query.redir || '/'
				, request : 	request
			});
		});

		// POST requests for /logon will attempt to authenticate the given user
		app.post('/logon',
			// first authenticate
			Adminion.auth.passport.authenticate('local', { failureRedirect: '/logon', failureFlash: true })

			// then fulfill the request
			, function (request, response, next) {
				console.log("[%s] %s logged in.", Date(), request.user.handle);
				return response.redirect(request.body.redir);
			}
		);

		// GET requests for /logoff will kill the users session and redirect to root
		app.get('/logoff', function (request, response) {
			console.log("[%s] %s logged out.",
				Date(),
				request.user.email);
			request.logOut();
			response.redirect('/');
		});

		////////////////////////////////////////////////////////////////////////
		//
		// P E O P L E
		//
		////////////////////////////////////////////////////////////////////////

		// GET requests for /people will check for auth then display all people
		app.get('/people', Adminion.auth.verify, function (request, response) {
			Adminion.db.Person.find(null, null, {limit: 10}, function(err, people) {
				if (err) { 
					console.trace(err)
					debug.val('err', err, 'lib/http.js', 148);
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
		app.get('/people/create', /* Adminion.auth.verify, */ function (request, response) {
			response.render('people/create', {
				request : 	request
				, err: false
				, redir: request.redir || '/logon'
			});
		});

		app.post('/people', /* Adminion.auth.verify, */ function (request, response) {
			// create a new Player instance that we will attempt to create
			var newPlayer = new Adminion.db.Person({
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
				Adminion.db.Person.register(newPlayer, request.body.password, function(err, person) {
					if (err) { 
						console.trace(err)
						debug.val('err', err, 'lib/http.js', 188);
						response.render('errors/500', {request: request});
					} else {
						response.redirect('/people/' + person.email);
					}
				});
			}

		});

		// GET requests for /people/:email will check for auth then display the person's profile
		app.get('/people/:email', Adminion.auth.verify, function (request, response) {
			// find the person requested
			Adminion.db.Person.findByUsername(request.params.email, function(err, person) {
				// if there is an error, emit 'error' which should kill the page with the error message...?
				if (err) { 
					console.trace(err)
					debug.val('err', err, 'lib/http.js', 346);
					response.render('errors/500', {request: request});
				} else {
					debug.emit('var' , 'person', person, 'lib/http.js', 208);
					response.render('people/person', {
						person : person
						, request : request
					});
				}
			});
		});

		// GET requests for /people/:email/update with check for auth then
		// display a form filled with the user's current data
		app.get('/people/:email/update', Adminion.auth.verify, function (request, response) {
			// make sure a person's email has been specified
			if (request.params.email) {
				// if a user was specified, lookup that user, and then....
				Adminion.db.Person.findByUsername(request.params.email, function(err, person) {
					// if an error occurs, emit the error
					if (err) { 
						console.trace(err)
						debug.val('err', err, 'lib/http.js', 277);
						response.render('errors/500', {request: request});
					} else if (!person) {
						response.render('errors/404', {request: request});
					} else {
						// output the person that we got back for debug purposes
		//					debug.val( 'person', person, 'lib/http.js', 233);
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

		app.post('/people/:email/update', Adminion.auth.verify, function (request, response) {
			// make sure a person's email has been specified
			if (request.params.email) {
				// define updated person
				updatedPlayer = {
					firstName: request.body.firstName
					, lastName: request.body.lastName
					, handle: request.body.handle
				};

				// find the existing person, then when finished....
				Adminion.db.Person.findByUsername(request.params.email, function(err, person) {
					// if there is an error finding this user
					if (err) { 
						console.trace(err)
						debug.val('err', err, 'lib/http.js', 263);
						response.render('errors/500', {request: request});
					} else {

						// update the person as defined, then...
						person.update(updatedPlayer, function(err, numberAffected, raw) {
							// emit err, if any
							if (err) { 
								console.trace(err)
								debug.val('err', err, 'lib/http.js', 272);
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
													debug.val('err', err, 'lib/http.js', 287);
													response.render('errors/500', {request: request});
												} else {
													// save the password changes
													person.save(function(error){
														// if there was an error
														if (err) { 
															console.trace(err)
															debug.val('err', err, 'lib/http.js', 295);
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
		// G A M E S
		//
		////////////////////////////////////////////////////////////////////////

		// GET requests for /games will authenticate then display list of games in play
		app.get('/games', Adminion.auth.verify, function (request, response) {

			Adminion.db.Game.where('status').equals('lobby').limit(20).exec(function(err, games) {
				if (err) { 
					console.trace(err)
					debug.val('err', err, 'lib/http.js', 333);
					response.render('errors/500', {request: request});
				} else if (!games) {
					response.render('errors/404', {request: request});
				}  else {
					debug.val('Adminion.realtime.sockets', Adminion.realtime.sockets, 'lib/http.js', 338);
					debug.val('games', games, 'lib/http.js', 339);

					response.render('games' , {
						games: games
						, request : request
					});
				}
			});
		});

		// GET requests for /games/create will authenticate, then display the form to create a game
		app.get('/games/create', Adminion.auth.verify, function (request, response) {
			response.render('games/create', {request : request});
		});

		// GET requests for /games/:game will authenticate, then display game stats
		app.get('/games/:gameID', Adminion.auth.verify, function (request, response) {
			//debug.val('mongoStore', mongoStore, 'lib/http.js', 457);

			Adminion.db.Game.findById(request.params.gameID, function(err, game) {
				if (err) { 
					console.trace(err)
					debug.val('err', err, 'lib/http.js', 361);
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
		app.get('/games/:gameID/lobby', Adminion.auth.verify, function (request, response) {		
			Adminion.db.Game.findById(request.params.gameID, function(err, game) {
				if (err) { 
					console.trace(err)
					debug.val('err', err, 'lib/http.js', 379);
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
		app.get('/games/:gameID/play', Adminion.auth.verify, function (request, response) {
			response.render('games/play', { request : request});
		});

		// GET requests for /spectate will check for authorization
		app.get('/games/:gameID/spectate', Adminion.auth.verify, function (request, response) {
			response.render('games/spectate', {request: request});
		});

		// POST requests for /games will authenticate then create a new game instance
		app.post('/games', Adminion.auth.verify, function (request, response) {

			// debug.val( 'request.user', request.user, 'lib/gamesServer.js', 457);

			// create Game model instance
			var newGame = new Adminion.db.Game({
				name : request.body.name
				, playerOne : { 
					handle: 		request.user.handle
					, playerID: 	request.user['_id']
					, sessionID: 	request.sessionID
				}
			});

			// save the new game to Adminion.db
			newGame.save(function(err) {
				if (err) { 
					console.trace(err);
					debug.val('err', err, 'lib/http.js', 425);
					response.render('errors/500', {request: request});
				} else {
					var gameID = newGame['_id'];

					debug.val('Adminion.realtime.sockets', Adminion.realtime.sockets, 'lib/http.js', 430);

					// save the new game 
					Adminion.realtime.games[gameID] = newGame;

					debug.val('Adminion.realtime.games[gameID]', Adminion.realtime.games[gameID], 'lib/http.js', 436);

					debug.val('newGame', newGame, 'lib/http.js', 437);

					response.redirect('/games/' + gameID + '/lobby');	
				}
			});
		});

		// create a server instance depending on the boolean conversion of Adminion.config.http
		self.server = !!Adminion.config.https
			// if https is enabled, create https server
			? https.createServer(Adminion.config.https.data, app )
			// otherwise, create http server
			: http.createServer(app);
				
		self.server.listen(Adminion.config.port, function() { onReady(self); });
	}
};

// export the constructor 
module.exports = function (adminion, onReady) {

	// store pointer to 
	Adminion = adminion;

	var instance = new HTTP();

	instance.init(onReady);
};