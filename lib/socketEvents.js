
var util = require('util');

var socketEvents = module.exports = {
	connection: function (socket) {
		socket.emit('news', { news: 'welcome to adminion!' });
		
		socket.on('private message', function (data) {
			console.log('private message from %s: %s', data.from, data.msg);
		});
		
		socket.on('public message', function (data) {
			var update = util.format('%s: %s', data.from, data.msg);
			console.log('public message from %s', update);;
			socket.emit('news', { news: update});
		});
	}
};