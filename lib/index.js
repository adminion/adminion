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

    function getAccount (email, callback) {

        if (Active.Accounts.exists(email)) {
            return Active.Accounts[email];
        } else {
            tools.db.getAccount
        }
    };

    function getAccounts (offset, count, callback) {
        offset = Number(offset) || 0;
        count = Number(count) || 20;

        var keys = Object.keys(Active.Accounts);
        var accounts = [];
        var account;

        debug.val('keys', keys, 'lib/index', 231);

        for (var i = offset; i < offset + count; i += 1) {

            // which account?
            account = Active.Accounts[keys[i]];

            if (!!account) {
                // add to the accounts array the Account whose key is at index i
                accounts.push(account);
                debug.val('accounts', accounts, 'lib/index', 236);
            }
        }

        return accounts;
    };

    function getGame (gameID, callback) {
        return Active.Games[gameID] || false;
    };

    function getGames (offset, callback) {
        offset = Number(offset) || 0;
        count = Number(count) || 20;

        var keys = Object.keys(Active.Games);
        var games = [];
        var game;

        debug.val('keys', keys, 'lib/index', 231);

        for (var i = offset; i < offset + count; i += 1) {

            // which game?
            game = Active.Games[keys[i]];

            if (!!game) {
                // add to the games array the Game whose key is at index i
                games.push(game);
                debug.val('games', games, 'lib/index', 236);
            }
        }

        return games;

    };

    function logon (account) {

        Active.Accounts[account.email] = account;

        debug.val('Active.Accounts', Active.Accounts, 'lib/index.js', 224);
    };

    function logoff (email) {
        delete Active.Accounts[email];
        debug.val('Active.Accounts', Active.Accounts, 'lib/index.js', 229);
    };

    function newGame (game) { 
        Active.Games[game['_id']] = game;

        debug.val('Active.Games', Active.Games, 'lib/index.js', 252);
    };

    function endGame  (gameID) {
        delete (Active.Games[gameID]);
        debug.val('Active.Games', Active.Games, 'lib/index.js', 257);
    };


// initialize the database
    function dbInit () {
        debug.marker('Initializing database...', 'lib/index', 31);

        // create a db module instance passing it Server
        db = adminion_db(config.mongodb);

        // when db module is ready
        db.on('ready', function () {
            debug.marker('database initialized', 'lib/index', 38);

            // now we're ready to init the http utility
            httpInit();
        });

        db.connect();

        return true;
    };

    // initialize the webserver
    function httpInit () {
        debug.marker('Initializing http server...','lib/index', 48);

        var tools = {
            config: config,
            db: db,
            env: env,
        };

        // create a db module instance and pass to it the tools
        http = adminion_http(tools);

        // when http module is ready
        http.on('ready', function () {
            debug.marker('...http server initialized.', 'lib/index', 55);

            // now we're ready to init the realtime utility
            realtimeInit();
        });

        http.on('logon', logon);
        http.on('logoff', logoff);

        http.listen();

        return true; 

    };

    // initialize the realtime system
    function realtimeInit () {
        debug.marker('Initializing socket.io...', 'lib/index', 64);

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

        realtime.on('ready', function () {
            debug.marker('...socket.io initialized.', 'lib/index', 70);

            // now we're ready to serve requests!
            ready();
        });

        realtime.on('err', function (err) {
            throw err;
        });
       
    };

    function ready () {
        debug.marker (util.format("\nAdminion Game Server ready --> %s", env.url()), 'lib/index', 83);

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
        debug.marker('Starting Adminion Game Server...', 'lib/index.js', 166);
        
        this.emit('starting');

        dbInit();

    };

    Server.stop = function () {

        this.emit('stopping');

        console.log('not sure how to gracefully stop the server. ');
    
    };

    Server.kill = function () {

        debug.marker('Server recevied KILL command--ending now!', 'lib/index.js', 181);
        
        process.exit();
    };

    // return our server instance
    return Server;
};
