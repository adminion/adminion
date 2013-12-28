
global.debug = require('./lib/debug')();

var config = require('./lib/config'),
    env = require('./lib/env'),
    util = require('./lib/util');

var AdminionCluster = require('cluster');
var workers = [];
var readyWorkers = 0;

console.log('Starting Adminion game server...');

AdminionCluster.setupMaster({
    exec: "worker.js",
    silent: false
});

AdminionCluster.on('fork', function (worker) {
    debug.emit('marker', 'Forking worker ' + worker.id + '.', 'master.js', 20);
});

AdminionCluster.on('online', function (worker) {
    debug.emit('marker', 'Worker ' + worker.id + ' online.', 'master.js', 24);
});

AdminionCluster.on('disconnect', function (worker) {
    debug.emit('marker', 'Worker ' + worker.id + ' disconnected.', 'master.js', 28);
});

AdminionCluster.on('exit', function (worker) {
    debug.emit('marker', 'Worker ' + worker.id + ' died.', 'master.js', 32);

});


function restart (workerId) { 
    if (workerId) {
        if (typeof workerId === 'number') {
            workers[workerId].disconnect();
        } else {
            return false;
        }
    } else {
        for (var i = 0; i < config.workers; i += 1) {
            
            workers[i].on('exit', function (worker) {
                workers[worker.id] = AdminionCluster.fork();
            });

            workers[i].disconnect();
        }
    }
};

function stop () {
    for (var i = 0; i < config.workers; i += 1) {
        workers[i].removeListener
    }
}

// start all the workers
for (var i = 0; i < config.workers; i+=1) {
    workers[i] = AdminionCluster.fork();

    // when a message from this worker is received
    workers[i].on('message', function (data) {
        debug.emit('marker', 'message received from worker ' + i, 'master.js', 65);

        // if the worker is saying it is ready...
        if (data['ready'] && data['ready'] === true) {
            // add 1 to the readyWorkers countu
            readyWorkers += 1;

            // if all of our workers are ready...
            if (readyWorkers === config.workers) {

                var msg = '\n    %s worker';

                if ( config.workers > 1 ) {
                    msg += 's';
                }

                msg += ' running.';
                
                console.log(util.format(msg, config.workers));

                // notify the console user that the server is ready
                console.log(
                    util.format('\nAdminion Game Server Started!\n --> %s', env.url())
                );

                process.stdout.write('> ');

                process.stdin.resume();
                process.stdin.setEncoding('utf8');

                process.stdin.on('data', function(chunk) {

                    if (typeof data === 'string') {
                        switch (data) { 
                            case 'restart':
                                restart();
                                break;
                            case 'stop':
                                stop();
                                break;
                        }
                    }
                    process.stdout.write('data: ' + chunk);
                });

                process.stdin.on('end', function() {
                    process.stdout.write('end');
                });
            }
        }


    });
}

