
var url = window.location.href.split('/');

var protocol = 'https:'; //url[0];
var address = url[2];
var host = url[2].split(':')[0];
var port = url[2].split(':')[1];
var directory = url[3];
var gameId = url[4];

var socket = io.connect();

socket.on('joined', function (newPlayer, players) {
	$("#PlayersList").replaceWith(function() {
		var newPlayersList = '<ul id="PlayersList">';
		players.forEach(function(player, index) {
			newPlayersList += '<li>' + player + '</li>\n';
		});
		newPlayersList += '</ul>';
		return newPlayersList;
	});

});

socket.on('msg', function(msg) {
	console.log(msg);
});

socket.emit('msg', "I'm in, let's play!");

socket.emit('join', gameId);