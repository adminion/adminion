
// load core node modules
var http = require('http')
	, https = require('https');

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

// define all application routes
app.get('/', game.get.root);
app.get('/logon', game.get.logon);

// note that this is a POST request...
app.post('/logon', auth.passport.authenticate('local'), game.post.logon);

app.get('/logoff', game.get.logoff);

/**
 * authorization required
 */
app.get('/join', auth.verify, game.get.joinGame);
app.get('/lobby', auth.verify, game.get.lobby);
app.get('/play', auth.verify, game.get.play);
app.get('/spectate', auth.verify, game.get.spectate);

// display configuration settings for debugging purposes...
//console.log('app.js 62 - config', config);

/**
 * this is where Cluster code will go, eventually...
 */

// if https was enabled in the config
if (config.https) {
	// create https server instance, then listen!
	https.createServer(config.https, app).listen(config.port, adminion.listening);
} else {
	// create http server instance, then listen!
	http.createServer(app).listen(config.port, adminion.listening);
}

// now sit back and wait for requests!

