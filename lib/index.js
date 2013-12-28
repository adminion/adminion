/**
 *  lib/index.js
 *
 *  Adminion Server
 *
 *  Goal - Serve an HTTP API allowing:
 *  * accounts to login/logout
 *  * accounts to update themselves
 *  * accounts to start/stop games
 *  * accounts to update their games
 *  * accounts to join/leave games
 * 
 */

////////////////////////////////////////////////////////////////////////////////
//
// node core modules
//
////////////////////////////////////////////////////////////////////////////////

var cluster = require('cluster'),
    events = require('events');

////////////////////////////////////////////////////////////////////////////////
//
// adminion core modules
//
////////////////////////////////////////////////////////////////////////////////

var modules = ['db', 'cache', 'http', 'realtime'];

var adminion_cache =    require('./cache'),
    adminion_db =       require('./db'),
    adminion_http =     require('./http'),
    adminion_realtime = require('./realtime');

// Adminion core utilities
var config =    require('./config'),
    env =       require('./env'),
    util =      require('./util');


var cache,
    db,
    http,
    realtime;


////////////////////////////////////////////////////////////////////////////
//
// Private, Priviledged functions
//
////////////////////////////////////////////////////////////////////////////


// initialize the database
function dbInit () {
    // debug.emit('marker', 'Initializing database...', 'lib/index', 105);

    // create a db module instance passing it Server
    db = adminion_db(config.mongodb);

    // when db module is ready
    db.on('ready', dbReady);

    db.connect();

    return true;
};

function dbReady () {
    // debug.emit('marker', 'database initialized', 'lib/index', 119);

    // now we're ready to init the cache utility
    cacheInit();

    return true;
};

// initialize the cache utility
function cacheInit () {
    // debug.emit('marker', 'Initializing cache...', 'lib/index', 131);

    cache = adminion_cache({
        config: config, 
        db: db,
        util: util
    });

    cache.on('ready', cacheReady);

    cache.init();

    return true;

};

// once cache has initialized
function cacheReady () {
    // debug.emit('marker', '...cache initialized.', 'lib/index', 158);

    // now we're ready to init the http utility
    httpInit();

    return true;

};

// initialize the webserver
function httpInit () {
    // debug.emit('marker', 'Initializing http server...','lib/index', 140);

    // create a db module instance and pass to it the tools
    http = adminion_http({
        cache: cache,
        config: config,
        db: db, 
        env: env,
        util: util
    });

    http.on('ready', httpReady);

    http.listen();

    return true; 

};

function httpReady () {
    // debug.emit('marker', '...http server initialized.', 'lib/index', 164);

    // now we're ready to init the realtime utility
    realtimeInit();

    return true;
};

// initialize the realtime system
function realtimeInit () {
    // debug.emit('marker', 'Initializing socket.io...', 'lib/index', 174);

    // create a db module instance passing it neccessary tools
    realtime = adminion_realtime({
        cache:      cache,
        config:     config,
        db:         db,
        env:        env,
        http:       http,
        util:       util
    });

    realtime.on('ready', realtimeReady);

    // realtime.on('closed', );

    realtime.on('err', function (err) {
        throw err;
        AdminionServer.kill();
    });

    realtime.init();

    return true;
};

function realtimeReady () {
    // debug.emit('marker', '...socket.io initialized.', 'lib/index', 198);

    // now we're ready to serve requests!
    serverReady();

    return true;
};

var methods = {
    kill: function () {

        // debug.emit('marker', 'Server recevied KILL command--ending now!', 'lib/index.js', 51);
        
        process.exit();

        return true;
    },

    start: function () {
        // debug.emit('marker', 'Starting Adminion Game Server...', 'lib/index.js', 64);
        
        this.emit('starting');

        dbInit();

        return true;
    },

    stop: function () {

        this.emit('stopping');

        realtime.stop();
        
        return true;
    }
};

function serverInit () {

    this.config = config; 
    this.env = env;

    this.emit('ready');

    return true;

};

function serverReady () {

    var mem = process.memoryUsage();
    debug.emit('msg', 'process.memoryUsage().heapTotal: ' + mem.heapTotal / util.MB + ' MB', 'lib/index', 157);

    var id = cluster.isWorker ? cluster.worker.id : 0;

    debug.emit('marker', util.format("Adminion Game Server worker #%s ready --> %s", id, env.url()), 'lib/index', 207);

    AdminionServer.emit('ready');

    return true;
};

var AdminionConstructor = util.prototypalConstructor(events.EventEmitter, serverInit, methods);

debug.emit('val', 'AdminionConstructor', AdminionConstructor, 'lib/index', 233);

module.exports = AdminionConstructor;
