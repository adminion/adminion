
// require adminion modules
var env = require('../lib/env')
	, players = require('../models/players');

// require node core modules
var _url= require('url');

var game = module.exports = {
	get: {},
	post: {}
};

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

game.get.root = function(request, response) {
	response.render('root', {
		session: 	request.session
	});
};

game.get.logon = function(request, response) {
	response.render('logon', {
		err: false,
		redir: _url.parse(request.url,true).query.redir || '/'
	});
};

game.get.logoff = function(request, response) {
	console.log("[%s] %s logged out.",
		Date(),
		request.session.player.username);
	delete request.session.player;
	response.redirect('/');
};

game.get.joinGame = function(request, response) {
	response.end('joinGame');
};

game.get.lobby = function(request, response) {
	response.end('lobby');
};

game.get.play = function(request, response) {
	response.end('play');
};

game.get.spectate = function(request, response) {
	response.end('spectate');
};

