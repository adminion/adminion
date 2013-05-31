
// require node core modules
var crypto = require('crypto')
	, url = require('url');

// require adminion modules
var env = require('../lib/env')
	, player = require('../models/player')
	, shasum = crypto.createHash('sha1');

var get = {}
	, post: {};

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
get.root = function(request, response) {
	response.render('root', {
		session: 	request.session
	});
};

// GET requests for /logon will respond with the logon form
get.logon = function(request, response) {
	response.render('logon', {
		err: false,
		redir: url.parse(request.url,true).query.redir || '/'
	});
};

// If user has authenticated, do this
post.logon = function(request, response){
	request.session.player = request.user;
	console.log("[%s] %s logged in.",
		Date(),
		request.user.username);
};

// GET requests for /logoff will kill the users session and redirect to root
get.logoff = function(request, response) {
	console.log("[%s] %s logged out.",
		Date(),
		request.session.player.username);
	delete request.session.player;
	response.redirect('/');
};

// GET requests for /join will authenticate the user and then 
get.joinGame = function(request, response) {
	response.end('joinGame');
};

// GET requests for /lobby will display the game lobby if authorized
get.lobby = function(request, response) {
	response.end('lobby');
};

// GET requests for /play will check for authorization then display the game
get.play = function(request, response) {
	response.end('play');
};

// GET requests for /spectate will check for authorization
get.spectate = function(request, response) {
	response.end('spectate');
};

module.exports = { 
	get: get
	, post: post 
};

