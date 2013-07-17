
var url = window.location.href.split('/');

var protocol = 'https:'; //url[0];
var address = url[2];
var host = url[2].split(':')[0];
var port = url[2].split(':')[1];
var directory = url[3];
var gameId = url[4];

var socket = io.connect();

var connectedPlayers = {};

socket.on('joined', function (newPlayer, players) {
	
	console.log(newPlayer + ' joined the game.');

});

socket.on('disjoined', function (oldPlayer, players) {
	
	console.log(oldPlayer + ' left the game.');

});

socket.on('roster', function (players) {
	connectedPlayers = players;
	console.log(connectedPlayers);

	$("#PlayersList").replaceWith(function() {
		var newPlayersList = '<div id="PlayersList"><blockquote><table>';
		newPlayersList += '<tr><th>Player No.</th><th>Handle</th></tr>';

		for (player in players) {
			newPlayersList += '<tr><td>' + player + '</td><td>' + players[player].handle + '</td></tr>\n';
		};

		newPlayersList += '</table></blockquote></div>';
		return newPlayersList;
	});
});

socket.on('denied', function(reason) {
	console.log('denied: ' + reason);

});

socket.on('msg', function(msg) {
	console.log(msg);
});

socket.emit('join', gameId);

$('#chat_submit').on('click', function(event) {

});