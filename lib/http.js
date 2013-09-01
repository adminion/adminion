
// node core modules

var events = require('events')
	, http = require('http')
	, https = require('https')
	, url = require('url');

// 3rd party modules
var express = require('express')
	, flash = require('connect-flash')
	, connectMongo = require('connect-mongo')(express);

function verify (request, response, next) {
	var redirectURL;

	console.log('%s - Authorizaton required...', request.url);
//		debug.emit('var' , 'request.session', request.session, 'lib/auth.js', 332);
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

// export the http factory function
module.exports = function (adminion) {

	var http = Object.create(events.EventEmitter.prototype);

	http.cookieParser = express.cookieParser;
		
	var app = express();

	//when NODE_ENV is undefined
	app.configure(function () { 
		app.set('port', adminion.config.port);
		app.set('views', adminion.config.views);
		app.set('view engine', adminion.config.viewEngine);
		app.use(express.favicon(adminion.config.favicon));
		app.use(express.logger('short'));

		// for PUT requests
		app.use(express.bodyParser());
		app.use(express.methodOverride());

		// sets up session store in memory also using cookies
		app.use(express.cookieParser());

		http.mongoStore = new connectMongo({ mongoose_connection: adminion.db.connection});

		app.use(express.session({
			cookie 		: adminion.config.session.cookie
			, key 		: 'adminion.sid'
			, secret	: adminion.config.session.secret
			, store 	: http.mongoStore
		}));

		// allows us to use connect-flash messages
		app.use(flash());

		// setup passport
		app.use(adminion.db.passport.initialize());
		app.use(adminion.db.passport.session());

		// have express try our routes (not yet defined) before looking for static content
		app.use(app.router);

		// serve static content if no routes were found
		app.use(express.static('public'));

		// error handler should be last resort
	//	app.use(function (err, req, res, next){
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

	// make the properties adminion object available as variables in all views
	app.locals = {
		adminion : {
			env: adminion.env
		}
		, config : adminion.config.locals
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
		adminion.db.passport.authenticate('local', { failureRedirect: '/logon', failureFlash: true })

		// then fulfill the request
		, function (request, response, next) {
			console.log("[%s] %s logged in.", Date(), request.user.handle);
			adminion.realtime.emit('logon', request.user);

			return response.redirect(request.body.redir);
		}
	);

	// GET requests for /logoff will kill the users session and redirect to root
	app.get('/logoff', function (request, response) {
		console.log("[%s] %s logged out.",
			Date(),
			request.user.email);

		adminion.realtime.emit('logoff', request.user);
		request.logOut();

		response.redirect('/');
	});

	////////////////////////////////////////////////////////////////////////
	//
	// P E O P L E
	//
	////////////////////////////////////////////////////////////////////////

	// GET requests for /accounts will check for auth then display all accounts
	app.get('/accounts', verify, function (request, response) {
		adminion.db.Accounts.find(null, null, {limit: 10}, function (err, accounts) {
			if (err) { 
				console.trace(err)
				debug.val('err', err, 'lib/http.js', 148);
				response.render('errors/500', {
					err: err,
					request: request
				});
			} else {
				response.render('accounts', {
					accounts : accounts,
					request : request
				});
			}
		});
	});

	// get requests
	app.get('/accounts/create', /* verify, */ function (request, response) {
		response.render('accounts/create', {
			request : 	request
			, err: false
			, redir: request.redir || '/logon'
		});
	});

	app.post('/accounts', /* verify, */ function (request, response) {
		// create a new Account instance that we will attempt to create
		var newAccount = new adminion.db.Accounts({
			email : request.body.email
			, firstName : request.body.firstName
			, lastName : request.body.lastName
			, handle : request.body.handle
		});

		if (request.body.password !== request.body.verifyPassword) {
			response.render('accounts/create', {
				request : 	request
				, err: 'Passwords do not match!'
				, redir: request.redir || '/logon'
			});
		} else {
			// attempt to register the user via passport-local-mongoose's register plugin
			adminion.db.Accounts.register(newAccount, request.body.password, function (err, account) {
				if (err) { 
					console.trace(err)
					debug.val('err', err, 'lib/http.js', 188);
					response.render('errors/500', {
						err: err,
						request: request
					});
				} else {
					response.redirect('/accounts/' + account.email);
				}
			});
		}

	});

	// GET requests for /accounts/:email will check for auth then display the account's profile
	app.get('/accounts/:email', verify, function (request, response) {
		// find the account requested
		adminion.db.Accounts.findByUsername(request.params.email, function (err, account) {
			// if there is an error, emit 'error' which should kill the page with the error message...?
			if (err) { 
				console.trace(err)
				debug.val('err', err, 'lib/http.js', 346);
				response.render('errors/500', {
					err: err,
					request: request
				});
			} else {
				debug.emit('var' , 'account', account, 'lib/http.js', 208);
				response.render('accounts/account', {
					account : account
					, request : request
				});
			}
		});
	});

	// GET requests for /accounts/:email/update with check for auth then
	// display a form filled with the user's current data
	app.get('/accounts/:email/update', verify, function (request, response) {
		// make sure a account's email has been specified
		if (request.params.email) {
			// if a user was specified, lookup that user, and then....
			adminion.db.Accounts.findByUsername(request.params.email, function (err, account) {
				// if an error occurs, emit the error
				if (err) { 
					console.trace(err)
					debug.val('err', err, 'lib/http.js', 277);
					response.render('errors/500', {
						err: err,
						request: request
					});
				} else if (!account) {
					response.render('errors/404', {request: request});
				} else {
					// output the account that we got back for debug purposes
	//					debug.val( 'account', account, 'lib/http.js', 233);
					// render accounts/update.jade
					response.render('accounts/update', {
						account: account
						, request : request
					});
				}
			});
		// if no user was specified...
		} else {
			// redirect to /accounts
			response.redirect('/accounts');
		}
	});

	app.post('/accounts/:email/update', verify, function (request, response) {
		// make sure a account's email has been specified
		if (request.params.email) {
			// define updated account
			updatedAccount = {
				firstName: request.body.firstName
				, lastName: request.body.lastName
				, handle: request.body.handle
			};

			// find the existing account, then when finished....
			adminion.db.Accounts.findByUsername(request.params.email, function (err, account) {
				// if there is an error finding this user
				if (err) { 
					console.trace(err)
					debug.val('err', err, 'lib/http.js', 263);
					response.render('errors/500', {
						err: err,
						request: request
					});
				} else {

					// update the account as defined, then...
					account.update(updatedAccount, function (err, numberAffected, raw) {
						// emit err, if any
						if (err) { 
							console.trace(err)
							debug.val('err', err, 'lib/http.js', 272);
							response.render('errors/500', {
								err: err,
								request: request
							});
						} else {

							// verify that one and only one document was affected
							if (numberAffected !== 1) {
								// if both the password and verify password fields are set...
								if (request.body.password && request.body.verifyPassword) {
									// and if the password and verify password fields are equal...
									if (request.body.password === request.body.verifyPassword) {
										// update the account's password, then...
										account.setPassword(request.body.password, function (error){
											// make sure there was no error
											if (err) { 
												console.trace(err)
												debug.val('err', err, 'lib/http.js', 287);
												response.render('errors/500', {
													err: err,
													request: request
												});
											} else {
												// save the password changes
												account.save(function (error){
													// if there was an error
													if (err) { 
														console.trace(err)
														debug.val('err', err, 'lib/http.js', 295);
														response.render('errors/500', {
															err: err,
															request: request
														});
													} else {
														console.log('account updated!');
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

					response.redirect('/accounts/' + account.email);
				}
			});
		// if no user was specified...
		} else {
			// redirect to /accounts
			response.redirect('/accounts');
		}
	});

	////////////////////////////////////////////////////////////////////////
	//
	// G A M E S
	//
	////////////////////////////////////////////////////////////////////////

	// GET requests for /games will verify then display list of games in play
	app.get('/games', verify, function (request, response) {

		response.render('games' , {
			accounts: adminion.realtime.getAccounts()
			, games: adminion.realtime.getGames()
			, request : request
		});
	});

	// GET requests for /games/create will verify, then create a game
	app.get('/games/create', verify, function (request, response) {
		// debug.val( 'request.user', request.user, 'lib/gamesServer.js', 457);

		// create Game model instance
		var newGame = new adminion.db.Games({
			playerOne : {
				handle: request.user.handle,
				accountID: request.user['_id']
			}
		});

		// save thplayere new game to adminion.db
		newGame.save(function (err) {
			if (err) { 
				console.trace(err);
				debug.val('err', err, 'lib/http.js', 425);
				response.render('errors/500', {
					err: err,
					request: request
				});
			} else {
				var gameID = newGame['_id'];

				debug.val('adminion.realtime.sockets', adminion.realtime.sockets, 'lib/http.js', 430);

				// save the new game 
				adminion.realtime.emit('gameCreated', newGame);


				debug.val('newGame', newGame, 'lib/http.js', 437);

				response.redirect('/games/' + gameID + '/lobby');	
			}
		});
	});

	// GET requests for /games/:game will verify, then display game stats
	app.get('/games/:gameID', verify, function (request, response) {
		var game = adminion.realtime.getGame(request.params.gameID);

		if ( game === false ) {
			response.render('errors/404', {request: request});
		}  else {

			var playerOne = adminion.realtime.getAccount(game.playerOne.accountID);

			if ( playerOne === false) {
				response.render('errors/500', {err: new Error('no PlayerOne?'), request: request});
			}  else {	
				response.render('games/game', {
					game: game
					, playerOne: playerOne
					, request: request
				});
			}
		}
	});

	// GET requests for /lobby will display the game lobby if authorized
	app.get('/games/:gameID/lobby', verify, function (request, response) {		
		var game = adminion.realtime.getGame(request.params.gameID);

		if ( game === false ) {
			response.render('errors/404', {request: request});
		}  else {

			var playerOne = adminion.realtime.getAccount(game.playerOne.accountID);

			if ( playerOne === false ) {
				response.render('errors/500', {err: new Error('no PlayerOne?'), request: request});
			}  else {	
				response.render('games/lobby', {
					game: game
					, playerOne: playerOne
					, request: request
				});
			}
		}
	});

	// GET requests for /play will check for authorization then display the game
	app.get('/games/:gameID/play', verify, function (request, response) {
		response.render('games/play', { request : request});
	});

	// GET requests for /spectate will check for authorization
	app.get('/games/:gameID/spectate', verify, function (request, response) {
		response.render('games/spectate', {request: request});
	});

	// create a server instance depending on the boolean conversion of adminion.config.http
	http.server = !!adminion.config.https
		// if https is enabled, create https server
		? https.createServer(adminion.config.https.data, app )
		// otherwise, create http server
		: http.createServer(app);
			
	// instruct the server to start listening
	http.server.listen(adminion.config.port, function () { 
		// once the server is listening, emit ready
		http.emit('ready'); 
	});

	// return the http module
	return http;

};
