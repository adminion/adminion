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

// node core modules
var events = require('events');

// adminion core modules
var adminion_db =        require('./db'),
    adminion_http =      require('./http'),
    adminion_realtime =  require('./realtime');

// export the Server factory function
module.exports = function AdminionServer () {

    // the Server Object itself
    var Server = Object.create(events.EventEmitter.prototype);

    // system-wide modules
    var config =    require('./config'),
        env =       require('./env'),
        util =      require('./util');

    // system utilities
    var db,
        http,
        realtime;

    // active accounts and games
    var active = {
        accounts    : {},
        games       : {}
    };

    Object.defineProperty(active.accounts, 'exists', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: function (email) {
            return !!this[email];
        }
    });

    Object.defineProperty(active.games, 'exists', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: function (gameID) {
            return !!this[gameID];
        }
    });

    function getConfig () {
        return config;
    };

    function getEnv () {
        return env;
    };

    function restart () {

        this.emit('restarting');

        // process.restart...?
    };

    function start () {
        debug.marker('Starting Adminion Game Server...', 'lib/index.js', 209);
        
        this.emit('starting');

        dbInit();

    };

    function stop () {

        this.emit('stopping');

        console.log('not sure how to gracefully stop the server. ');
    
    };

    function kill () {

        debug.marker('Server recevied KILL command--ending now!', 'lib/index.js', 227);
        
        process.exit();
    };

    function logon (account) {

        active.accounts[account.email] = account;

        debug.val('active.accounts', active.accounts, 'lib/index.js', 67);
    };

    function logoff (email) {
        delete active.accounts[email];
        debug.val('active.accounts', active.accounts, 'lib/index.js', 73);
    };

    function newGame (game) { 
        active.games[game['_id']] = game;

        debug.val('active.games', active.games, 'lib/index.js', 78);
    };

    function endGame  (gameID) {
        delete (active.games[gameID]);
        debug.val('active.games', active.games, 'lib/index.js', 83);
    };


// initialize the database
    function dbInit () {
        debug.marker('Initializing database...', 'lib/index', 89);

        // create a db module instance passing it Server
        db = adminion_db(config.mongodb);

        // when db module is ready
        db.on('ready', dbReady);

        db.connect();

        return true;
    };

    function dbReady () {
        debug.marker('database initialized', 'lib/index', 96);

        db.getGames({ $or: [{'status' : 'lobby'}, {'status': 'play'} ]}, null, function (err, games) {
            if (err) {
                throw err;
            }

            debug.val('games', games, 'lib/index', 103);

            var game
                , gameID
                , index;

            for (index in games) {
                game = games[index];
                active.games[game.id] = game;
            }

            debug.val('active.games', active.games, 'lib/index', 116);

            // now we're ready to init the http utility
            httpInit();

        });

        return true;
    };

    // initialize the webserver
    function httpInit () {
        debug.marker('Initializing http server...','lib/index', 130);

        var tools = {
            config: config,
            db: db,
            env: env,
        };

        // create a db module instance and pass to it the tools
        http = adminion_http(tools);

        // when http module is ready
        http.on('logon', logon);
        http.on('logoff', logoff);
       
        http.on('ready', httpReady);

        http.listen();

        return true; 

    };

    function httpReady () {
        debug.marker('...http server initialized.', 'lib/index', 143);

        // now we're ready to init the realtime utility
        realtimeInit();

        return true;
    };

    // initialize the realtime system
    function realtimeInit () {
        debug.marker('Initializing socket.io...', 'lib/index', 160);

        var tools = {
            config:     config,
            db:         db,
            env:        env,
            http:       http,
            util:       util,
            active:     active
        };

        // create a db module instance passing it neccessary tools
        realtime = adminion_realtime(tools);

        realtime.on('ready', realtimeReady);

        realtime.on('err', function (err) {
            throw err;
        });

        return true;
    };

    function realtimeReady () {
        debug.marker('...socket.io initialized.', 'lib/index', 175);

        // now we're ready to serve requests!
        serverReady();

        return true;
    };

    function serverReady () {
        debug.marker (util.format("\nAdminion Game Server ready --> %s", env.url()), 'lib/index', 188);

        Server.emit('ready');

        return true;
    };

    Server.config = getConfig;

    Server.env = getEnv;

    Server.restart = restart;
    
    Server.start = start;

    Server.stop = stop;

    Server.kill = kill;

    // return our server instance
    return Server;
};
