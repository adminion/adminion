
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
		console.log('Initializing database...');
		// get the db module
		this.db = require('./db');
		this.db.on('ready', function() { self.emit('dbReady'); });
		this.db.connect();
	};
	
	this.authInit = function () {
		console.log('Initializing authorization subsystem...');
		// createStrategy() returns the pre-built strategy
		this.passport.use(this.db.Player.createStrategy());	
		// serializeUser() and deserializeUser() return the functions passport will use 
		this.passport.serializeUser(this.db.Player.serializeUser());
		this.passport.deserializeUser(this.db.Player.deserializeUser());
		
		// signal that auth tools are ready
		self.emit('authReady');
	}
	
	this.expressInit = function() {
		console.log('Initializing webserver...')
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
			debug.emit('var' , 'request.session', request.session, 'lib/adminion.js', 142);
			response.render('root', {
				request : 	request
			});
		});
		
		// GET requests for /logon will respond with the logon form
		this.app.get('/logon', function(request, response) {
			response.render('logon', {
				err: false
				, redir: url.parse(request.url,true).query.redir || '/'
				, request : 	request
			});
		});

		// GET requests for /logoff will kill the users session and redirect to root
		this.app.get('/logoff', function(request, response) {
			console.log("[%s] %s logged out.",
				Date(),
				request.session.passport.user);
			request.logOut();
			response.redirect('/');
		});
		
		this.app.get('/register', function(request, response) {
			response.render('register', {
				request : 	request
				, err: false
				, redir: request.redir || '/logon'
			});
		});
		
		// GET requests for /players will check for auth then display all players
		this.app.get('/players', this.ensureAuth, function(request, response) {
			self.db.Player.find(null, null, {limit: 10}, function(err, players) {
				if (err) { self.emit('error', err); }
				response.render('players', {
					players : players,
					request : request
				});
			});
		});
		
		// GET requests for /players/:handle will check for auth then display the player's profile
		this.app.get('/players/:email', this.ensureAuth, function(request, response) {
			debug.emit('var' , 'request.params', request.params, 'lib/adminion.js', 242);
			self.db.Player.findOne({email: request.params.email}, function(err, player) {
				if (err) { self.emit('error', err); }
				debug.emit('var' , 'player', player, 'lib/adminion.js', 247);
				response.render('players/player', {
					player : player 
					, request : request
				});
			});
		});
		
		////////////////////////////////////////////////////////////////////////
		// POST requests
		////////////////////////////////////////////////////////////////////////
		
		// note that this is a POST request...
		this.app.post('/logon', 
			// first authenticate
			this.passport.authenticate(
				'local'
				, { failureRedirect: '/logon' }
			)
			// then fulfill the request
			, function (request, response, next) {
				console.log("[%s] %s logged in.", Date(), request.user.handle);
				return response.redirect(request.body.redir);
			}
		);

		this.app.post('/players/register', function(request, response) {
			debug.emit('var', 'this', this , 'lib/adminion.js', 206); // when this is called, this points to Global
			debug.emit('var', 'self', self, 'lib/adminion.js', 207); // self refers to the adminion module as it should
			
			// create a new Player instance that we will attempt to register
			var newPlayer = new self.db.Player({ 
				email : request.body.email 
				, firstName : request.body.firstName
				, lastName : request.body.lastName
				, handle : request.body.handle
			});
			
			// attempt to register the user, also verifying that the password is unique
			self.db.Player.register(newPlayer, request.body.password, function(err) {
				if (err) {
					self.emit('error', err);
				}
				response.redirect('/logon');
			});
		});
		
		

		////////////////////////////////////////////////////////////////////////
		// authorization required
		//////////////////////////////////////////////////////////////////////// 
		
		// GET requests for /games will authenticate then display list of games in play
		this.app.get('/games', this.ensureAuth, function(request, response) {
			self.db.Game.find({status: "lobby"}, function(err, games) {
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
		this.app.get('/games/:game', this.ensureAuth, function(request, response) {
			response.render('games/game', {request: request});
		});
		
		// GET requests for /games/:game/join will authenticate the user and then 
		this.app.get('/games/:game/join', this.ensureAuth, function(request, response) {
			 
			var gameID = request.params.game;
			var player = request.session.passport.user;
			 
			// check to make sure that there are enough seats available in the gameServer
			self.db.Game.findOne({_id: gameID}, function(err, game) {
				if (err) { 
					self.emit('error', err); 
				}
				// if there is room left in the array
				if (game.players.length < game.config.numPlayers) {
			
					console.log('-this-------------------------');
					console.log(this);
					console.log('-self-------------------------');
					console.log(self);
					console.log('-me-------------------------');
					console.log(me);		
					
					game.players.push(player);
					
					// update the game's players array
					self.db.Game.findByIdAndUpdate(gameID, {players: game.players}, function() {
						console.log('updated user');
					});
				}
			});
		});

		// GET requests for /lobby will display the game lobby if authorized
		this.app.get('/games/:game/lobby', this.ensureAuth, function(request, response) {
			response.render('games/lobby', { request : request});
		});

		// GET requests for /play will check for authorization then display the game
		this.app.get('/games/:game/play', this.ensureAuth, function(request, response) {
			response.render('games/play', { request : request});
		});

		// GET requests for /spectate will check for authorization
		this.app.get('/games/:game/spectate', this.ensureAuth, function(request, response) {
			response.render('games/spectate', {request: request});
		});
		
		
		// POST requests for /games/create will authenticate then create a new game instance
		this.app.post('/games/create', this.ensureAuth, function(request, response) {
			
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
		console.log('%s - Authentication required', request.url);
		debug.emit('var' , 'request.session', request.session, 'lib/adminion.js', 249);
		if (request.isAuthenticated()) {
			console.log('%s - %s already authenticated.', request.url, request.session.passport.user);
			return next();
		} else {
			console.log('NOT authenticated.  redirecting to logon...');
			var redirectURL = util.format('/logon?redir=%s&err=%s',
				request.url,
				'You need to logon before you can visit ' + request.url
			);
			response.redirect(redirectURL);
		}
	};
	
	this.listening = function() {
		console.log("Adminion game server listening!\n --> %s", this.env.url);
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

