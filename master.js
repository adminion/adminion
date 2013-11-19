
var config = require('./lib/config'),
	debug = require('./lib/debug')();

var cluster = require('cluster');

cluster.setupMaster({
	exec: "worker.js",
	silent: false
});

cluster.on('fork', function (worker) {
	debug.emit('marker', 'Forking worker ' + worker.id + '.', 'app', 26);
});

cluster.on('online', function (worker) {
	debug.emit('marker', 'Worker ' + worker.id + ' started.', 'app.js', 30);

	// once online, start the next worker
	if (cluster.workers.length < config.workers) {
		cluster.fork();
	}
});

cluster.on('exit', function (worker) {
	debug.emit('marker', 'Worker ' + worker.id + ' died; forking replacement...', 'app.js', 34);
	cluster.fork();
});

