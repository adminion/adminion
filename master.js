
console.log('Starting Adminion game server...');

global.debug = require('./lib/debug')();

var util = require('util')

var ClusterFuck = require('cluster-fuck'),
    config = require('./lib/config'),
    env = require('./lib/env'),
    utils = require('./lib/utils');

var adminionCluster = new ClusterFuck(config.cluster);

adminionCluster.on('ready', function onClusterReady () {
    console.log('Adminion Cluster is now ready!');
});

adminionCluster.on('starting', function onClusterStarting () {
    console.log('starting cluster...');
});

adminionCluster.on('restarting', function onClusterRestarting () {
    console.log('restarting cluster...');
});

adminionCluster.on('restarted', function onClusterRestarted () {
    console.log('cluster restarted!');
});

adminionCluster.on('stopping', function onClusterStopping () {
    console.log('stopping cluster...');
});

adminionCluster.on('stopped', function onClusterStopped () {
    console.log('cluster stopped!');
});

adminionCluster.on('killing', function onClusterKilling () {
    console.log('killing cluster...');
});

adminionCluster.on('killed', function onClusterKilled () {
    console.log('cluster killed!');
});

adminionCluster.start();