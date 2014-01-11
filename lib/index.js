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

var events = require('events'),
    util = require('util');

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
    utils =      require('./utils');


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
    // debug.emit('msg', 'Initializing database...');

    // create a db module instance passing it Server
    db = adminion_db(config.mongodb);

    // when db module is ready
    db.on('ready', dbReady);

    db.connect();

    return true;
};

function dbReady () {
    // debug.emit('msg', 'database initialized');

    // now we're ready to init the cache utility
    cacheInit();

    return true;
};

// initialize the cache utility
function cacheInit () {
    // debug.emit('msg', 'Initializing cache...');

    cache = adminion_cache({
        config: config, 
        db: db,
        utils: utils
    });

    cache.on('ready', cacheReady);

    cache.init();

    return true;

};

// once cache has initialized
function cacheReady () {
    // debug.emit('msg', '...cache initialized.');

    // now we're ready to init the http utility
    httpInit();

    return true;

};

// initialize the webserver
function httpInit () {
    // debug.emit('msg', 'Initializing http server...');

    // create a db module instance and pass to it the tools
    http = adminion_http({
        cache: cache,
        config: config,
        db: db, 
        env: env,
        utils: utils
    });

    http.on('ready', httpReady);

    http.listen();

    return true; 

};

function httpReady () {
    // debug.emit('msg', '...http server initialized.');

    // now we're ready to init the realtime utility
    realtimeInit();

    return true;
};

// initialize the realtime system
function realtimeInit () {
    // debug.emit('msg', 'Initializing socket.io...');

    // create a db module instance passing it neccessary tools
    realtime = adminion_realtime({
        cache:      cache,
        config:     config,
        db:         db,
        env:        env,
        http:       http,
        utils:       utils
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
    // debug.emit('msg', '...socket.io initialized.');

    // now we're ready to serve requests!
    server.emit('ready');

    return true;
};

function AdminionServer () {

    this.config = config; 
    this.env = env;

    this.kill = function () {

        // debug.emit('msg', 'Server recevied KILL command--ending now!');
        
        process.exit();

        return true;
    };

    this.start = function () {
        // debug.emit('msg', 'Starting Adminion Game Server...');
        
        this.emit('starting');

        dbInit();

        return true;
    };

    stop = function () {

        this.emit('stopping');

        realtime.stop();
        
        return true;
    };

    return true;

};

util.inherits(AdminionServer, events.EventEmitter);

// debug.emit('val', 'AdminionServer', AdminionServer);

var server = new AdminionServer();

module.exports = server;
