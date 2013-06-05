
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
	var self = this;
	
	// 3rd party modules 
	this.express = require('express')
	, this.MongoStore = require('connect-mongo')(this.express)
	, this.passport = require('passport');
	
	// require all the adminion library modules
	this.config = require('./config')
		, this.env = require('./env');

	// public method for starting game server
	this.startGame = function () {
		this.emit('gameStart');
	};
	
	// session initializer
	this.sessionInit = function() {
		// get the db module
		this.db = require('./db');
		this.db.on('ready', this.authInit);
		this.db.connect();
	};
	
	this.authInit = function () {
		self.passport.use(self.db.Player.createStrategy());	
		self.passport.serializeUser(self.db.Player.serializeUser());
		self.passport.deserializeUser(self.db.Player.deserializeUser);
		self.emit('sessionReady');
	}
	
	this.expressInit = function() {
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
				secret: "4$BoD8Uoo7$hjI1ZbrPB+hd8Sh3peZ20SUbPU4", 
				store:	new self.MongoStore({
					db: 'adminion'
				})
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
		this.app.locals = {env: this.env};

		/* 
		 * The root of the site displays info about the game server:
		 *	- IP address and hostname
		 *	- Server status: not started, started, finished
		 *	- List of all Players' usernames
		 *	- Current time
		 *	- Elapsed time
		 *	- Creation timestamp
		 *	- Start timestamp
		 *	- End timestamp
		 *
		 * Non-Authenticated users are given the option to logon
		 * Authenticated users, depending on privacy policy set by Player 1, users may 
		 * be given options to:
		 *	- Join if: 
		 *		* There is a reserved seat for that user, or
		 *		* There is at least one public seat open
		 *	- Spectate if:
		 *		* Specating is enabled, and
		 * 		* That user has been authorized as spectator
		 */

		// define all application routes
		this.app.get('/', function(request, response) {
			response.render('root', {
				session: 	request.session
			});
		});
		
		this.app.get('/register', function(request, response) {
			response.render('register', {
				err: false,
				redir: '/logon'
			});
		});
		
		this.app.post('/register', function(request, response) {
//			console.log('this - ', this); // when this is called, this points to Global
//			console.log('self - ', self); // self refers to the adminion module as it should
			
			// create a new Player instance that we will attempt to register
			var newPlayer = new self.db.Player({ email : request.body.email });
			
			// attempt to register the user, also verifying that the password is unique
			self.db.Player.register(newPlayer, request.body.password, function(err) {
				if (err) {
					self.emit('error', err);
				}
				response.redirect('/logon');
			});
		});
		
		// GET requests for /logon will respond with the logon form
		this.app.get('/logon', function(request, response) {
			response.render('logon', {
				err: false,
				redir: url.parse(request.url,true).query.redir || '/'
			});
		});

		// note that this is a POST request...
		this.app.post('/logon', 
			this.passport.authenticate(
				'local'
				, { failureRedirect: '/logon' }
			)
			, function (request, response, next) {
				console.log("[%s] %s logged in.", Date(), request.user.handle);
				return response.redirect('/users/' + request.user.handle);
			}
		);

		// GET requests for /logoff will kill the users session and redirect to root
		this.app.get('/logoff', function(request, response) {
			console.log("[%s] %s logged out.",
				Date(),
				request.session.player.username);
			request.logOut();
			response.redirect('/');
		});

		/**
		 * authorization required
		 */ 
		 
		// GET requests for /join will authenticate the user and then 
		this.app.get('/join', this.ensureAuth, function(request, response) {
			response.end('joinGame');
		});

		// GET requests for /lobby will display the game lobby if authorized
		this.app.get('/lobby', this.ensureAuth, function(request, response) {
			response.end('lobby');
		});

		// GET requests for /play will check for authorization then display the game
		this.app.get('/play', this.ensureAuth, function(request, response) {
			response.end('play');
		});

		// GET requests for /spectate will check for authorization
		this.app.get('/spectate', this.ensureAuth, function(request, response) {
			response.end('spectate');
		});
		
		// GET requests for /players/:handle will check for auth then displays the player's profile
		this.app.get('/players/:handle', this.ensureAuth, function(request, response) {
//			console.log('lib/adminion.js 218 - self.db.Player');
//			console.log(self.db.Player);
			self.db.Player.findOne({handle: request.params.handle}, function(err, player) {
				if (err) {
					self.emit('error', err);
				}
				console.log('adminion.js - session')
				console.log(request.session)
				response.render('player', {
					email : player.email
					, fname : player.firstName
					, handle : player.handle
					, lname : player.lastName
					, session : request.session
				});
			});
		});

		this.emit('expressReady');
	};
	
	this.ensureAuth = function (request, response, next) {
		console.info('%s - Authentication required', request.url);
		if (request.isAuthenticated()) {
			console.log('lib/adminion.js 236 - request');
			console.log(request)
			console.log('%s - %s already authenticated.', request.url, request.session.user);
			return next();
		} else {
			console.log('NOT authenticated.  redirecting to logon...');
			response.redirect('/logon?redir=' + request.url);
		}
	};
	
	this.startServer = function() {
		// if https was enabled in the config
		if (this.config.https) {
			// create https server instance, then listen!
			this.server = https.createServer(this.config.https.data, this.app).listen(this.config.port, this.onceListening);
		} else {
			// create http server instance, then listen!
			this.server = http.createServer(this.app).listen(this.config.port, this.onceListening);
		}
	};
	
	this.onceListening = function() {
		var secure = (self.config.https) ? ' for secure connections' : '';
		 
		console.log("Adminion game server '%s' listening%s.\nJoin game --> %s/join", 
			self.env.serverName, secure, self.env.url
		);
		self.emit('listening'); 
	};
};

// Copies all of the EventEmitter properties 
Adminion.prototype.__proto__ = events.EventEmitter.prototype;

// create instance of Adminion
var game = module.exports = new Adminion();

// define event handlers for this instance
game.once('gameStart', game.sessionInit);
game.once('sessionReady', game.expressInit);
game.once('expressReady', game.startServer);

//console.log('lib/adminion.js - game');
//console.log(game);


