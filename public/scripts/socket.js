
function Debug() {

	this.val = function (name, value, file, line) {
		console.log("\n%s %s - %s", file, line, name);
		console.log(value);
		console.log();
	};
	
	this.msg = function (message, file, line) {
		console.log('\n%s %s: %s\n', file, line, message);
	};

}

debug = new Debug();

var url = window.location.href.split('/');

var protocol = 'https:'; //url[0];
var address = url[2];
var host = url[2].split(':')[0];
var port = url[2].split(':')[1];
var directory = url[3];
var gameId = url[4];

var socket = io.connect();

var connectedPlayers = {};

socket.on('entered', function (newPlayer, players) {
	
	console.log(newPlayer + ' joined the game.');

});

socket.on('exited', function (oldPlayer, players) {
	
	console.log(oldPlayer + ' left the game.');

});

socket.on('roster', function (players) {
	connectedPlayers = players;
	debug.val('connectedPlayers', connectedPlayers, '/scripts/socket.js', 64);

	$("#PlayersList").replaceWith(function() {
		var newPlayers ={};
		var newPlayersList = '<div id="PlayersList"><blockquote><table>';
		newPlayersList += '<tr><th>Player No.</th><th>Handle</th></tr>';

		// create an array of players who's keys are their seat numbers
		players.forEach(function(player) {
			newPlayers[''+player.seat] = player.handle;
		});

		debug.val('newPlayers', newPlayers, '/scripts/socket.js', 64);

		for (var seat in newPlayers) {
			newPlayersList += '<tr><td>' + seat + '</td><td>' + newPlayers[seat] + '</td></tr>\n';
		};

		newPlayersList += '</table></blockquote></div>';
		return newPlayersList;
	});
});

socket.on('denied', function(reason) {
	console.log('denied: ' + reason);
	window.location = '/games';
});

socket.on('msg', function(msg) {
	console.log(msg);
});

socket.emit('enterLobby', gameId);

$('#chat_submit').on('click', function(event) {

});