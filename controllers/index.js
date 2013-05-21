
// require adminion modules
var env = require('../lib/env')
	, players = require('../models/players');

// require node core modules
var _url= require('url');

var game = module.exports = {
	get: {},
	post: {}
};


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
game.get.root = function(request, response) {
	response.render('root', {
		session: 	request.session
	});
};

// GET requests for /logon will respond with the logon form
game.get.logon = function(request, response) {
	response.render('logon', {
		err: false,
		redir: _url.parse(request.url,true).query.redir || '/'
	});
};

// POST requests for /auth will attempt to authenticate the user POSTed
game.post.auth = function(request, response){
	var credentials = {
		username: request.body.username, 
		password: request.body.password
	};
	
	players.findOne(credentials, function(player) {
		if (player) {
			request.session.started = Date();
			request.session.player = player;
			console.log("[%s] %s logged in.", request.session.started, player.username);
			console.log('request.session: %j',request.session);
			
			response.redirect(request.body.redir || '/');
		} else {
			console.log('[%s] failed to authenticate %s.'
				, Date()
				, request.body.username
			);
			response.render('logon', {
				err: 'invalid username/password',
				redir: request.body.redir,
			});
		}
	});
};

// GET requests for /logoff will kill the users session and redirect to root
game.get.logoff = function(request, response) {
	console.log("[%s] %s logged out.",
		Date(),
		request.session.player.username);
	delete request.session.player;
	response.redirect('/');
};

// GET requests for /join will authenticate the user and then 
game.get.joinGame = function(request, response) {
	response.end('joinGame');
};

// GET requests for /lobby will display the game lobby if authorized
game.get.lobby = function(request, response) {
	response.end('lobby');
};

// GET requests for /play will check for authorization then display the game
game.get.play = function(request, response) {
	response.end('play');
};

// GET requests for /spectate will check for authorization
game.get.spectate = function(request, response) {
	response.end('spectate');
};

