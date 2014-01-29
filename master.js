
console.log('Starting Adminion game server...');

global.debug = require('./lib/debug')();

var cluster = require('cluster'),
    util = require('util');

var config = require('./lib/config'),
    env = require('./lib/env'),
    utils = require('./lib/utils');

var memory = {};

var deadWorkers;
var readyWorkers;
var suicide;

cluster.setupMaster({
    exec: "worker.js",
    silent: (config.debug) ? false : true
});

cluster.on('fork', function fork (worker) {
    // debug.emit('msg', 'Forking worker ' + worker.id + '.');
});

cluster.on('online', function online (worker) {
    // debug.emit('msg', 'Worker ' + worker.id + ' online.');
    initWorker(worker);
});

cluster.on('disconnect', function disconnect (worker) {
    debug.emit('msg', 'Worker ' + worker.id + ' disconnected.');
    delete memory[worker.id];
});

cluster.on('exit', function exit (worker) {
    debug.emit('msg', 'Worker ' + worker.id + ' died.');
    
    delete memory[worker.id];
    
    deadWorkers +=1;

    if (suicide) {
        if (deadWorkers === config.workers) {
            process.kill();
        }
    } else {
        cluster.fork();
    }

});

function restart (worker) { 
    var id;

    console.log('restarting the server...');

    // if a given worker was specified
    if (worker) {
        worker.kill();
        cluster.fork();
    } else {
        for (id in cluster.workers) {
            cluster.workers[id].kill();
        }

        startWorkers();
    }
};

function stop () {
    var id;

    suicide = true;
    deadWorkers = 0;

    for (id in cluster.workers) {
        cluster.workers[id].kill();
    }

};

function totalMemory () {

    var masterMemory = process.memoryUsage().heapTotal,
        serverTotal,
        workerId,
        workerTotal = 0;

    // debug.emit('val', 'masterMemory', masterMemory, 'master.js', 73);
    // debug.emit('val', 'memory', memory, 'master.js', 74);
    // debug.emit('val', 'workerTotal', workerTotal, 'master.js', 75);

    for (workerId in memory) {
        workerTotal += memory[workerId];

        // debug.emit('val', 'workerId', workerId, 'master', 78);
        // debug.emit('val', 'memory[' + workerId + ']', memory[workerId], 'master', 79);
        // debug.emit('val', 'workerTotal', workerTotal, 'master', 81);

    }

    serverTotal = masterMemory + workerTotal;

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

    console.log('\nAdminion Game Server Started!\n --> %s', env.url());

    console.log('\ntotal memory usage: %s MB', totalMemory());

    process.stdout.write('> ');

    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', function stdinData(chunk) {
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

    process.stdin.on('end', function stdinEnd() {
        process.stdout.write('end');
    });
};



function initWorker (worker) {
    // when a message from this worker is received
    worker.on('message', function message (data) {

        // debug.emit('msg', 'message received from worker ' + workerId, 'master.js', 132);
        
        // if the worker is saying it is ready...
        if (data['ready'] && data['ready'] === true) {
            // add 1 to the readyWorkers count
            readyWorkers += 1;
            
            memory[worker.id] = data['memoryUsage'];

            // if all of our workers are ready...
            if (readyWorkers === config.workers) {
                allReady();
            }       
        }
    });
};

function startWorkers() {

    var forked = 0;
    readyWorkers = 0;

    // start all the workers
    while (forked < config.workers) {
        cluster.fork();
        forked +=1;
    }
}

startWorkers();