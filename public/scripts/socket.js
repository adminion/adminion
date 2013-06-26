
var url = window.location.href.split('/');

var protocol = 'https:'; //url[0];
var host = url[2].split(':')[0];
var port = url[2].split(':')[1];
var directory = url[3];
var gameId = url[4];

console.log 

var socketServer =  [url[0],url[1], url[2]].join('/');

var socket = io.connect(socketServer);

socket.on('msg', function(msg) {
	console.log(msg);
});
socket.emit('lobby', gameId);

socket.emit('msg', 'hello, socket server!')