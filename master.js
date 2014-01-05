
global.debug = require('./lib/debug')();

var cluster = require('cluster'),
    util = require('util');

var config = require('./lib/config'),
    env = require('./lib/env'),
    utils = require('./lib/utils');

console.log('Starting Adminion game server...');

cluster.setupMaster({
    exec: "worker.js",
    silent: (config.debug) ? false : true
});


cluster.on('fork', function (worker) {
    // debug.emit('marker', 'Forking worker ' + worker.id + '.', 'master.js', 20);
});

cluster.on('online', function (worker) {
    // debug.emit('marker', 'Worker ' + worker.id + ' online.', 'master.js', 24);
});

cluster.on('disconnect', function (worker) {
    debug.emit('marker', 'Worker ' + worker.id + ' disconnected.', 'master.js', 28);
    delete memory[worker.id];
});

cluster.on('exit', function (worker) {
    debug.emit('marker', 'Worker ' + worker.id + ' died.', 'master.js', 32);
    delete memory[worker.id];
      
});

function restart (workerId) { 
    console.log('trying to restart the server...');
    if (workerId) {
        if (typeof workerId === 'number') {
            var worker = cluster.workers[workerId];

            worker.on('exit', function (worker) {
                cluster.fork();
            });

            worker.disconnect();
        } else {
            return false;
        }
    } else {
        for (var id in cluster.workers) {
            var worker = cluster.workers[id];
            
            worker.on('exit', function (worker) {
                cluster.fork();
            });

            worker.disconnect();
        }
    }
};

function stop () {

    for (var id in cluster.workers) {
        cluster.workers[id].kill();
    }
};

function totalMemory () {

    var masterMemory = process.memoryUsage().heapTotal;    
    var workerTotal = 0;

    // debug.emit('val', 'masterMemory', masterMemory, 'master.js', 73);
    // debug.emit('val', 'memory', memory, 'master.js', 74);
    // debug.emit('val', 'workerTotal', workerTotal, 'master.js', 75);

    for (var workerId in memory) {
        workerTotal += memory[workerId];

        // debug.emit('val', 'workerId', workerId, 'master', 78);
        // debug.emit('val', 'memory[' + workerId + ']', memory[workerId], 'master', 79);
        // debug.emit('val', 'workerTotal', workerTotal, 'master', 81);

    }

    var serverTotal = masterMemory + workerTotal;

    // debug.emit('val', 'serverTotal', serverTotal, 'master', 89);

    return serverTotal / utils.MB;
};

function allReady () {
    var msg = '\n\t%s worker';

    if ( config.workers > 1 ) {
        msg += 's';
    }

    msg += ' running.';
    
    console.log(util.format(msg, config.workers));

    // notify the console user that the server is ready
    console.log('\nAdminion Game Server Started!\n --> %s', env.url());

    console.log('\ntotal memory usage: %s MB', totalMemory());

    process.stdout.write('> ');

    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', function (chunk) {
        switch (chunk.trim()) { 
            case 'restart':
                restart();
                break;

            case 'stop':
                stop();
                break;
        }

        process.stdout.write('> ');
    });

    process.stdin.on('end', function () {
        process.stdout.write('end');
    });
};


var memory = {};
var readyWorkers = 0;


// start all the workers
for (var i = 0; i < config.workers; i+=1) {
    var worker = cluster.fork();

    (function (workerId) {
        cluster.workers[workerId].on('message', function (data) {

            // debug.emit('marker', 'message received from worker ' + workerId, 'master.js', 132);
            
            // if the worker is saying it is ready...
            if (data['ready'] && data['ready'] === true) {
                // add 1 to the readyWorkers count
                readyWorkers += 1;
                
                memory[workerId] = data['memoryUsage'];

                // if all of our workers are ready...
                if (readyWorkers === config.workers) {
                    allReady();
                }
            }
        });
    
    } (worker.id) );
    // when a message from this worker is received
}

