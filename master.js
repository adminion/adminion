
var debug = require('./lib/debug')();
var config = require('./lib/config');

var cluster = require('cluster');

cluster.setupMaster({
	exec: "worker.js",
	silent: false
});

// fork the number of workers as defined in config module
for (var i = 0; i < config.workers; i += 1) {
    cluster.fork();
}

cluster.on('fork', function (worker) {
	debug.emit('marker', 'Forking worker ' + worker.id + '.', 'app', 26);
});

cluster.on('online', function (worker) {
	debug.emit('marker', 'Worker ' + worker.id + ' started.', 'app.js', 30);
});

cluster.on('exit', function (worker) {
	debug.emit('marker', 'Worker ' + worker.id + ' died; forking replacement...', 'app.js', 34);
	cluster.fork();
});

