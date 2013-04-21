
/**
 * Module dependencies.
 */

var express = require('express')
  , socketio = require('socket.io')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , util = require('util');

var app = express();

// all environments
app.set('port', process.env.PORT || 1337);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

server = http.createServer(app);
io = socketio.listen(server);

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});



// define socket connection callback
io.sockets.on('connection', function (newSocket) {
	//log the socket for debug purposes 
	// NOTE trying to log it as a JSON will call stupid error
	
	newSocket.on('changeName', function(data) {
		var msg = {
			socket : util.format('%s - You changed your name to %s.', new Date(), data.after),
			group : util.format('%s - %s changed their name to %s.', new Date(), data.before, data.after)
		};
		
		// tell the socket the change was successful
		newSocket.emit('news', { update: msg.socket});
		
		// announce the new name to the group
		newSocket.broadcast.emit('news', { update: msg.group});
		console.log(msg.group);
	});
	
	newSocket.on('joinGame', function(data) {
		var msg = {
			socket : util.format('welcome to Adminion, %s!', data.name),
			group : util.format('%s - %s has joined the game.', new Date(), data.name)
		};
		
		// welcome the new socket to the conversation
		newSocket.emit('news', { update: msg.socket});
		
		// announce the new connection to the group
		newSocket.broadcast.emit('news', { update: msg.group});
		console.log(msg.group);
	});
	
	newSocket.on('public message', function (data) {
		var update = util.format('%s - %s: %s', new Date(), data.from, data.msg);
		console.log('public message from %s', update);;
		newSocket.emit('news', { update: update});
		newSocket.broadcast.emit('news', { update: update});
	});
} /* socketEvents.connection */);