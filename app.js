
// load core node modules
var https = require('https');

// load main library and controllers
var adminion = require('./lib/')
	, game = require('./controllers/');

// breaking main library into peices for easier, simpler, and smoother code
var app = adminion.app
	, auth = adminion.auth
	, config = adminion.config
	, env = adminion.env;

// make the properties this object available as variables in all views
app.locals = {env: env};

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
 * Non-Authenticated users are give the option to logon
 * Authenticated users, depending on privacy policy set by Player 1, users may 
 * be given options to:
 *	- Join if: 
 *		* There is a reserved seat for that user, or
 *		* There is at least one public seat open
 *	- Spectate if:
 *		* Specating is enabled, and
 * 		* That user has been authorized as spectator
 */
app.get('/', game.get.root);

// GET requests for /logon will respond with the logon form
app.get('/logon', game.get.logon);

// POST requests for /auth will attempt to authenticate the user POSTed
app.post('/auth', game.post.auth);

// GET requests for /logoff will kill the users session and redirect to root
app.get('/logoff', game.get.logoff);

// GET requests for /join will authenticate the user and then 
app.get('/join', auth.verify, game.get.joinGame);

// GET requests for /lobby will display the game lobby if authorized
app.get('/lobby', auth.verify, game.get.lobby);

// GET requests for /play will check for authorization then display the game
app.get('/play', auth.verify, game.get.play);

// GET requests for /spectate will check for authorization
app.get('/spectate', auth.verify, game.get.spectate);

// create https server instance and listen!
https.createServer({
	cert: 	config.express.cert, 
	key: 	config.express.key
},app).listen(config.express.port, function() {
	console.log('express server listening: http://localhost:%d.', config.express.port);
});

