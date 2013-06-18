
/**
 * Configure the main adminion library and module.exports equal to it
 */
 
// core modules
var events = require('events')
	, http = require('http')
	, https = require('https')
	, url = require('url')
	, util = require('util');

// adminion constructor
function Adminion() {
	// call EventEmitter constructor;
	events.EventEmitter.call(this);
	
	// create a pointer to adminion's "this"
	var self = this;
	
	// 3rd party modules 
	this.express = require('express')
	, this.flash = require('connect-flash')
	, this.MongoStore = require('connect-mongo')(this.express)
	, this.passport = require('passport');
	
	// require all the adminion library modules
	this.config = require('./config')
		, this.env = require('./env');

	////////////////////////////////////////////////////////////////////////////
	// module methods
	////////////////////////////////////////////////////////////////////////////

	// public method for starting game server
	this.Start = function () {
		console.log('Starting Adminion game server...');
		this.emit('serverStart');
	};
	
	// database initializer
	this.dbInit = function() {
//		console.log('Initializing database...');
		// get the db module
		this.db = require('./db');
		this.db.on('ready', function() { self.emit('dbReady'); });
		this.db.connect();
	};
	
	this.authInit = function () {
//		console.log('Initializing authorization subsystem...');
		// createStrategy() returns the pre-built strategy
		this.passport.use(this.db.Player.createStrategy());	
		// serializeUser() and deserializeUser() return the functions passport will use 
		this.passport.serializeUser(this.db.Player.serializeUser());
		this.passport.deserializeUser(this.db.Player.deserializeUser());
		
		// signal that auth tools are ready
		self.emit('authReady');
	}
	
	this.expressInit = function() {
//		console.log('Initializing webserver...')
		// define the adminion module object 
		this.app = this.express();

		//when NODE_ENV is undefined
		this.app.configure(function() {
			self.app.set('port', self.config.port);
			self.app.set('views', self.config.views);
			self.app.set('view engine', self.config.viewEngine);
			self.app.use(self.express.favicon(self.config.favicon));
			self.app.use(self.express.logger('short'));	

			// for PUT requests 
			self.app.use(self.express.bodyParser());
			self.app.use(self.express.methodOverride());

			// sets up session store in memory also using cookies
			self.app.use(self.express.cookieParser());
			self.app.use(self.express.session({
				cookie : 	self.config.session.cookie
				, secret: 	self.config.session.secret
				, store:	new self.MongoStore({ mongoose_connection: self.db.connection})
			}));
			
			// this allows us to use connect-flash messages
			self.app.use(self.flash());

			// setup passport
			self.app.use(self.passport.initialize());
			self.app.use(self.passport.session());

			// have express try our routes (not yet defined) before looking for static content
			self.app.use(self.app.router);

			// serve static content if no routes were found
			self.app.use(self.express.static('public'));

			// error handler should be last resort
		//	self.app.use(function(err, req, res, next){
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
		this.app.configure('dev',function () {
			self.app.use(self.express.errorHandler({
				dumpExceptions: true,
				showStack: true
			}));
		});

		//when NODE_ENV = 'production'
		this.app.configure('prod',function () {
			self.app.use(self.express.logger('prod'));
		});

		// make the properties this object available as variables in all views
		this.app.locals = {
			env: this.env
			, links : {
				"Games" : "/games"
				, "Players" : "/players"
			}
		};

		////////////////////////////////////////////////////////////////////////
		// Game Server "Portals"
		////////////////////////////////////////////////////////////////////////
		
		
		this.app.get('/', function(request, response) {
//			debug.emit('var' , 'request.session', request.session, 'lib/adminion.js', 140);
			response.render('root', {
				request : 	request
			});
		});
		
		// GET requests for /logon will respond with the logon form
		this.app.get('/logon', function(request, response) {
			response.render('logon', {
				err: request.flash('error')
				, redir: url.parse(request.url,true).query.redir || '/'
				, request : 	request
			});
		});

		// POST requests for /logon will attempt to authenticate the given user
		this.app.post('/logon', 
			// first authenticate
			this.passport.authenticate('local', { failureRedirect: '/logon', failureFlash: true })
			
			// then fulfill the request
			, function (request, response, next) {
				console.log("[%s] %s logged in.", Date(), request.user.handle);
				return response.redirect(request.body.redir);
			}
		);
		
		// GET requests for /logoff will kill the users session and redirect to root
		this.app.get('/logoff', function(request, response) {
			console.log("[%s] %s logged out.",
				Date(),
				request.user.email);
			request.logOut();
			response.redirect('/');
		});
		
		////////////////////////////////////////////////////////////////////////
		// AUTHORIZATION REQUIRED...
		//////////////////////////////////////////////////////////////////////// 

		
		////////////////////////////////////////////////////////////////////////
		// PLAYERS
		////////////////////////////////////////////////////////////////////////
		
		// GET requests for /players will check for auth then display all players
		this.app.get('/players', this.ensureAuth, function(request, response) {
			self.db.Player.find(null, null, {limit: 10}, function(err, players) {
				if (err) { console.trace(err); process.exit(); }
				response.render('players', {
					players : players,
					request : request
				});
			});
		});
		
		// get requests
		this.app.get('/players/create', this.ensureAuth, function(request, response) {
			response.render('players/create', {
				request : 	request
				, err: false
				, redir: request.redir || '/logon'
			});
		});
		
		this.app.post('/players', this.ensureAuth, function(request, response) {
			// create a new Player instance that we will attempt to create
			var newPlayer = new self.db.Player({ 
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
				self.db.Player.register(newPlayer, request.body.password, function(err, player) {
					if (err) { console.trace(err); process.exit(); }
					response.redirect('/players/' + player.email);
				});			
			}
			
		});
		
		// GET requests for /players/:email will check for auth then display the player's profile
		this.app.get('/players/:email', this.ensureAuth, function(request, response) {
			// find the player requested
			self.db.Player.findByUsername(request.params.email, function(err, player) {
				// if there is an error, emit 'error' which should kill the page with the error message...?
				if (err) { console.trace(err); process.exit(); }
				debug.emit('var' , 'player', player, 'lib/adminion.js', 238);
				response.render('players/player', {
					player : player
					, request : request
				});
			});
		});
		
		// GET requests for /players/:email/update with check for auth then 
		// display a form filled with the user's current data
		this.app.get('/players/:email/update', this.ensureAuth, function(request, response) {
			// make sure a player's email has been specified
			if (request.params.email) {
				// if a user was specified, lookup that user, and then....
				self.db.Player.findByUsername(request.params.email, function(err, player) {
					// if an error occurs, emit the error
					if (err) { console.trace(err); process.exit(); }
					// output the player that we got from the db for debug purposes
//					debug.emit('var', 'player', player, 'lib/adminion.js', 242);
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
		
		this.app.post('/players/:email/update', this.ensureAuth, function(request, response) {
			// make sure a player's email has been specified
			if (request.params.email) {
				// define updated player
				updatedPlayer = {
					firstName: request.body.firstName
					, lastName: request.body.lastName
					, handle: request.body.handle
				};
			
				// find the existing player, then when finished....
				self.db.Player.findByUsername(request.params.email, function(err, player) {
					// if there is an error finding this user
					if (err) { console.trace(err); process.exit(); }
				
					// update the player as defined, then...
					player.update(updatedPlayer, function(err, numberAffected, raw) {
						// emit err, if any
						if (err) { console.trace(err); process.exit(); }
						
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
		// GAMES
		//////////////////////////////////////////////////////////////////////// 
		
		// GET requests for /games will authenticate then display list of games in play
		this.app.get('/games', this.ensureAuth, function(request, response) {
			self.db.Game.find(null, null, {limit: 20}, function(err, games) {
//				debug.emit('var');
				response.render('games', {
					games: games
					, request : request
				});
			});
		});
		
		// GET requests for /games/create will authenticate, then display the form to create a game
		this.app.get('/games/create', this.ensureAuth, function(request, response) {
			response.render('games/create', {request : request});
		});
		
		// GET requests for /games/:game will authenticate, then display game stats
		this.app.get('/games/:gameId', this.ensureAuth, function(request, response) {
			self.db.Game.findById(request.params.gameId, function(err, game) {
				if (err) { console.trace(err); process.exit(); }
				response.render('games/game', {
					game: game
					, request: request
				});
			});
		});
		
		// GET requests for /games/:game/join will authenticate the user and then 
		this.app.get('/games/:gameId/join', this.ensureAuth, function(request, response) {
			// get a copy of the current game 
			self.db.Game.findById(request.params.gameId, function(err, game) {
				if (err) { console.trace(err); process.exit(); }
				// if there is an open seat...
				if (game.players.length < game.config.numPlayers) {
					// and if the player hasn't already joined...
					if (game.players.indexOf(request.user.email) === -1) {
						// add the player to the players array
						game.players.push(request.user.email);
						// update the game's players array
						game.update({ $set : {players: game.players }}, function() {
							console.log('%s joined game %s', request.user.email, game['_id']);
						});
					} else {
						console.log('%s has already joined game %s', request.user.email, game['_id']);
					}
				}
				response.redirect('/Games/' + game['_id'] + '/Lobby');
			});
		});

		// GET requests for /lobby will display the game lobby if authorized
		this.app.get('/games/:gameId/lobby', this.ensureAuth, function(request, response) {
			self.db.Game.findById(request.params.gameId, function(err, game) {
				if (err) { console.trace(err); process.exit(); }
				response.render('games/lobby', { 
					game: game
					, request : request
				});
			});
		});

		// GET requests for /play will check for authorization then display the game
		this.app.get('/games/:gameId/play', this.ensureAuth, function(request, response) {
			response.render('games/play', { request : request});
		});

		// GET requests for /spectate will check for authorization
		this.app.get('/games/:gameId/spectate', this.ensureAuth, function(request, response) {
			response.render('games/spectate', {request: request});
		});
		
		// GET request for /games/:gameId/leave
		this.app.get('/games/:gameId/leave', this.ensureAuth, function(request, response) {
			self.db.Game.findById(request.params.gameId, function (err, game) {
				if (err) { console.trace(err); process.exit(); }
			});
		});
		
		// POST requests for /games will authenticate then create a new game instance
		this.app.post('/games', this.ensureAuth, function(request, response) {
			// crate new game variable
			var newGame = new self.db.Game({
				name : request.body.name
				, players : [ request.user.email ]
				, log : { start : new Date() } 
			});

			newGame.save(function(err) {
				if (err) { console.trace(err); process.exit(); }
				response.redirect('/games/' + newGame['_id']);
			});	
			
		}); 
		
		// if https was enabled in the config
		if (this.config.https) {
			// create https server instance, then listen!
			this.server = https.createServer(this.config.https.data, this.app )
				.listen(this.config.port, function() { self.emit('expressReady'); });
		} else {
			// create http server instance, then listen!
			this.server = http.createServer(this.app)
				.listen(this.config.port, function() { self.emit('expressReady'); });
		}
	};
	
	
	/**
	 *	adminion.ensureAuth(request, response, next)
	 
	 * Authentication middleware used to ensure users are authorized to access
	 * the requested resource  
	 *
	 */
	
	this.ensureAuth = function (request, response, next) {
		console.log('%s - Authorizaton required...', request.url);
//		debug.emit('var' , 'request.session', request.session, 'lib/adminion.js', 332);
		if (request.isAuthenticated()) {
			console.log('\t--> %s is authorized', request.user.email);
			return next();
		} else {
			console.log('\t--> NOT authenticated.  redirecting to logon...');
			var redirectURL = util.format('/Logon?redir=%s&err=%s',
				request.url,
				'You need to logon before you can visit ' + request.url
			);
			response.redirect(redirectURL);
		}
	};
	
	this.listening = function() {
		console.log("listening --> %s", this.env.url);
		this.emit('listening');
	};
};

// Copies all of the EventEmitter properties 
Adminion.prototype.__proto__ = events.EventEmitter.prototype;

// create instance of Adminion
var gameServer = module.exports = new Adminion();

// define event handlers for this instance
gameServer.once('serverStart', gameServer.dbInit);
gameServer.once('dbReady', gameServer.authInit)
gameServer.once('authReady', gameServer.expressInit);
gameServer.once('expressReady', gameServer.listening)

//debug.emit('var', 'gameServer', gameServer, 'lib/adminion.js', 303);

