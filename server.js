
global.debug = require('./lib/debug')();

var cluster = require('cluster'),
    interrupt,
    util = require('util');

var ClusterFuck = require('cluster-fuck'),
    config = require('./lib/config').cluster;

process.on('SIGINT', function () {
    if (cluster.isMaster) {
        if (interrupt) {
            adminionCluster.shutdown(process.exit);
        } else {
            console.log('\n(^C again to quit)'); 
            interrupt = setTimeout(function () {
                interrupt = undefined;
            }, 1000);
        }
        
    } else {
        // it seems as though the master forwards SIGINT to all workers immediately, 
        // so telling workers to do nothing on SIGINT is a way of testing this hypothesis,
        // but not a good idea in production, definitely 
        server.status();
    }
});

if (cluster.isMaster) {
    console.log('Starting Adminion game server...');

    var adminionCluster = new ClusterFuck(config);

    adminionCluster.on('ready', function onClusterReady () {
        console.log('Adminion Cluster is now ready!');

        var memory = adminionCluster.memoryUsage('MB');

        debug.emit('msg', util.format('total memory usage: %d MB', memory ));
    });

    adminionCluster.on('starting', function onClusterStarting () {
        console.log('starting cluster...');
    });

    adminionCluster.on('restarting', function onClusterRestarting () {
        console.log('restarting workers...');
    });

    adminionCluster.on('restarted', function onClusterRestarted () {
        console.log('workers restarted!');
    });

    adminionCluster.on('stopping', function onClusterStopping () {
        console.log('stopping workers...');
    });

    adminionCluster.on('shuttingDown', function onClusterShuttingDown () {
        console.log('shutting down cluster...');
    });
    
    adminionCluster.on('shutdown', function onClusterShutdown () {
        console.log('cluster shut down!');
    });

    adminionCluster.on('stopped', function onClusterStopped () {
        console.log('workers stopped!');
    });

    adminionCluster.on('killing', function onClusterKilling () {
        console.log('killing workers...');
    });

    adminionCluster.on('killed', function onClusterKilled () {
        console.log('workers killed!');
    });

    adminionCluster.on('fork', function onWorkerFork (worker) {
        console.log('worker %s forked!', worker.id);
    });

    adminionCluster.on('online', function onWorkerOnline (worker) {
       console.log('worker %s online!', worker.id); 
    });

    adminionCluster.on('disconnect', function onWorkerDisconnect (worker) {
       console.log('worker %s disconnected!', worker.id); 
    });    

    adminionCluster.on('exit', function onWorkerExit (worker) {
       console.log('worker %s exited!', worker.id); 
    });

    adminionCluster.start();
    
} else {

    var AdminionServer = require('./lib/'),
        utils = require('./lib/utils');

    debug.emit('val', 'AdminionServer', AdminionServer);

    var server = AdminionServer();

    server.setMaxListeners(0);

    debug.emit('val', 'server', server);

    server.on('error', server.kill);

    server.on('ready', function ready () {
        
        var pieces = [
            'worker', 
            cluster.worker.id, 
            'ready -->', 
            server.env().url()
        ];

        debug.emit('msg', pieces.join(' '));

        process.send({'ready': true, 'memoryUsage': process.memoryUsage()});
        
        return true;
    });

    server.on('stopped', function stopped () {
        process.exit();
    });

    server.start();

}

