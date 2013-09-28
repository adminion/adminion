
var debug = Object.create(null);

debug.val = function (name, value, file, line) {
	console.log("\n%s %s - %s", file, line, name);
	console.log(value);
	console.log();
};
	
debug.msg = function (message, file, line) {
	console.log('\n%s %s: %s\n', file, line, message);
};

var url = window.location.href.split('/');

var protocol = url[0];
var address = url[2];
var host = url[2].split(':')[0];
var port = url[2].split(':')[1];
var directory = url[3];
var gameId = url[4];

var socket = io.connect();

var connectedPlayers = {};

function chat_send () {
	var msg = $('#chat_input')[0].value;
	socket.send(msg);
	$('#chat_input')[0].focus();
	$('#chat_input')[0].select();
};

function enable_chat () {
	$('#chat_input')[0].disabled = '';
	$('#chat_submit')[0].disabled = '';
};

function disable_chat () {
	$('#chat_input')[0].disabled = 'disabled';
	$('#chat_submit')[0].disabled = 'disabled';
};

$(document).ready(function() {
	$('#chat_input').on('keyup', function (event) {
		if (event.keyCode === 13) {
			chat_send();
		}
	});

	$('#chat_submit').on('click', function (event) {
		chat_send();
	});

	socket.on('connect', function () {
		socket.emit('joinGame', gameId);
	});

	socket.on('disconnect', function () {
		console.log('disconnect from server - have we disconnected yet? i\'ll try to emit another event...');
		socket.emit('test', {foo:'bar'});

		disable_chat();
	});

	socket.on('reconnect', function () {
		enable_chat();

	});

	socket.on('entered', function (newPlayer, players) {
		
		console.log(newPlayer + ' joined the game.');

	});

	socket.on('exited', function (oldPlayer, players) {
		
		console.log(oldPlayer + ' left the game.');

	});

	socket.on('roster', function (roster) {
		connectedPlayers = roster;
		debug.val('connectedPlayers', connectedPlayers, '/scripts/socket.js', 64);

		$("#PlayersList").replaceWith(function () {
			var updatedPlayersList = '<div id="PlayersList"><blockquote><table>';
			updatedPlayersList += '<tr><th>Player No.</th><th>Handle</th></tr>';

			for (var playerNo in roster) {

				updatedPlayersList += '<tr><td>' + (playerNo) + '</td><td>' + roster[playerNo] + '</td></tr>\n';
			};

			updatedPlayersList += '</table></blockquote></div>';
			return updatedPlayersList;
		});
	});

	socket.on('joined', function (result, reason) {
		if (!result) {
			console.log('denied: ' + reason);
			window.location = '/games/' + gameId;
		} else {
			console.log('joined!');
			enable_chat();
			$('#chat_input')[0].focus();
		}
	});

	socket.on('chat', function (msg) {
		
		// get the existing message
		var existing = $('#chat_log')[0].value;

		// and set the value to the existing chat content plus the new message at the end
		$('#chat_log')[0].value = existing + '\n' + msg;

		$('#chat_log')[0].scrollTop =    $('#chat_log')[0].scrollHeight;
		
	});
});

