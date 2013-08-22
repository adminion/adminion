
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

var protocol = url[0];
var address = url[2];
var host = url[2].split(':')[0];
var port = url[2].split(':')[1];
var directory = url[3];
var gameId = url[4];

var socket = io.connect();

var connectedPlayers = {};

socket.on('disconnect', function () {
	console.log('disconnect from server - have we disconnected yet? i\'ll try to emit another event...');

	socket.emit('test', {foo:'bar'});

});

socket.on('entered', function (newPlayer, players) {
	
	console.log(newPlayer + ' joined the game.');

});

socket.on('exited', function (oldPlayer, players) {
	
	console.log(oldPlayer + ' left the game.');

});

socket.on('roster', function (players) {
	connectedPlayers = players;
	debug.val('connectedPlayers', connectedPlayers, '/scripts/socket.js', 64);

	$("#PlayersList").replaceWith(function () {
		var updatedPlayersList = '<div id="PlayersList"><blockquote><table>';
		updatedPlayersList += '<tr><th>Player No.</th><th>Handle</th></tr>';

		players.forEach(function (player, seat) {
			updatedPlayersList += '<tr><td>' + (seat + 1) + '</td><td>' + player + '</td></tr>\n';
		});

		updatedPlayersList += '</table></blockquote></div>';
		return updatedPlayersList;
	});
});

socket.on('denied', function (reason) {
	console.log('denied: ' + reason);
	window.location = '/games/' + gameId;
});

socket.on('msg', function (msg) {
	console.log(msg);
});

socket.emit('joinGame', gameId);

$('#chat_submit').on('click', function (event) {

});