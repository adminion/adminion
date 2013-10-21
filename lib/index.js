/**
 *  lib/index.js
 *
 *  Adminion Server
 *
 *  Goal - Server an HTTP API allowing:
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
    var Active = {
        Accounts    : {},
        Games       : {}
    };

    Object.defineProperty(Active.Accounts, 'exists', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: function (email) {
            return !!this[email];
        }
    });

    Object.defineProperty(Active.Games, 'exists', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: function (gameID) {
            return !!this[gameID];
        }
    });

    function logon (account) {

        Active.Accounts[account.email] = account;

        debug.val('Active.Accounts', Active.Accounts, 'lib/index.js', 67);
    };

    function logoff (email) {
        delete Active.Accounts[email];
        debug.val('Active.Accounts', Active.Accounts, 'lib/index.js', 73);
    };

    function newGame (game) { 
        Active.Games[game['_id']] = game;

        debug.val('Active.Games', Active.Games, 'lib/index.js', 78);
    };

    function endGame  (gameID) {
        delete (Active.Games[gameID]);
        debug.val('Active.Games', Active.Games, 'lib/index.js', 83);
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
                Active.Games[game.id] = game;
            }

            debug.val('Active.Games', Active.Games, 'lib/index', 116);
            // now we're ready to init the http utility

            httpInit();
        });
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

    function httpReady() {
        debug.marker('...http server initialized.', 'lib/index', 143);

        // now we're ready to init the realtime utility
        realtimeInit();
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
            Active:     Active
        };

        // create a db module instance passing it neccessary tools
        realtime = adminion_realtime(tools);

        realtime.on('ready', realtimeReady);

        realtime.on('err', function (err) {
            throw err;
        });
       
    };

    function realtimeReady () {
        debug.marker('...socket.io initialized.', 'lib/index', 175);

        // now we're ready to serve requests!
        serverReady();
    };

    function serverReady () {
        debug.marker (util.format("\nAdminion Game Server ready --> %s", env.url()), 'lib/index', 188);

        Server.emit('ready');
    };

    Server.getConfig = function () {
        return config;
    };

    Server.getEnv = function () {
        return env;
    };

    Server.restart = function () {

        this.emit('restarting');

        // process.restart...?
    };
    
    Server.start = function () {
        debug.marker('Starting Adminion Game Server...', 'lib/index.js', 209);
        
        this.emit('starting');

        dbInit();

    };

    Server.stop = function () {

        this.emit('stopping');

        console.log('not sure how to gracefully stop the server. ');
    
    };

    Server.kill = function () {

        debug.marker('Server recevied KILL command--ending now!', 'lib/index.js', 227);
        
        process.exit();
    };

    // return our server instance
    return Server;
};
