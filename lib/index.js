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
var events = require('events'), 
    util = require('util');

// adminion core modules
var Db =        require('./db'),
    Http =      require('./http'),
    Realtime =  require('./realtime');

// export the Server factory function
module.exports = function AdminionServer () {

    var Server = Object.create(events.EventEmitter.prototype);

    var tools = {
        config:     require('./config'),
        env:        require('./env'),
        util:       require('./util')
    };

    var Games       = {},
        Accounts    = {};

    Object.defineProperty(Games, 'exists', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: function (gameID) {
            return !!this[gameID];
        }
    });

    Object.defineProperty(Accounts, 'exists', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: function (email) {
            return !!this[email];
        }
    });


    function getAccount (email, callback) {

        if (Accounts.exists(email)) {
            return Accounts[email];
        } else {
            tools.db.getAccount
        }
    };

    function getAccounts (offset, count, callback) {
        offset = Number(offset) || 0;
        count = Number(count) || 20;

        var keys = Object.keys(Accounts);
        var accounts = [];
        var account;

        debug.val('keys', keys, 'lib/index', 231);

        for (var i = offset; i < offset + count; i += 1) {

            // which account?
            account = Accounts[keys[i]];

            if (!!account) {
                // add to the accounts array the Account whose key is at index i
                accounts.push(account);
                debug.val('accounts', accounts, 'lib/index', 236);
            }
        }

        return accounts;
    };

    function getGame (gameID, callback) {
        return Games[gameID] || false;
    };

    function getGames (offset, callback) {
        offset = Number(offset) || 0;
        count = Number(count) || 20;

        var keys = Object.keys(Games);
        var games = [];
        var game;

        debug.val('keys', keys, 'lib/index', 231);

        for (var i = offset; i < offset + count; i += 1) {

            // which game?
            game = Games[keys[i]];

            if (!!game) {
                // add to the games array the Game whose key is at index i
                games.push(game);
                debug.val('games', games, 'lib/index', 236);
            }
        }

        return games;

    };

    function logon (account) {

        Accounts[account.email] = account;

        debug.val('Accounts', Accounts, 'lib/index.js', 224);
    };

    function logoff (email) {
        delete Accounts[email];
        debug.val('Accounts', Accounts, 'lib/index.js', 229);
    };

    function addGame (game) { 
        Games[game['_id']] = game;

        debug.val('Games', Games, 'lib/index.js', 252);
    };

    function removeGame  (gameID) {
        delete (Games[gameID]);
        debug.val('Games', Games, 'lib/index.js', 257);
    };

    Server.getConfig = function () {
        return config;
    };

    Server.getEnv = function () {
        return env;
    };

    Server.restart = function () {
        // process.restart...?
    };
    
    Server.start = function () {
        dbInit();
    };

    Server.stop = function () {
        console.log('not sure how to gracefully stop the server. ');
    };

    Server.kill = function () {
        process.exit();
    };




// initialize the database
    function dbInit () {
        debug.marker('Initializing database...', 'lib/index', 31);

        // create a db module instance passing it Server
        tools.db = Db(config.mongodb);

        // when db module is ready
        tools.db.on('ready', function () {
            debug.marker('database initialized', 'lib/index', 38);

            // emit the dbReady event on the Server
            Server.emit('dbReady');
        });

    };

    // initialize the webserver
    function httpInit () {
        debug.marker('Initializing http server...','lib/index', 48);

        // create a db module instance and pass to it the tools
        tools.http = Http(tools);

        // when http module is ready
        tools.http.on('ready', function () {
            debug.marker('...http server initialized.', 'lib/index', 55);

            // emit the httpReady event on the Server
            Server.emit('httpReady');
        });

        tools.http.on('logon', function (account) {
            logon(account);
        });

        tools.http.on('logoff', function (email) { 
            logoff(email);
        });

    };

    // initialize the realtime system
    function realtimeInit () {
        debug.marker('Initializing socket.io...', 'lib/index', 64);

        // create a db module instance passing it the tools
        tools.realtime = Realtime(tools);

        tools.realtime.on('ready', function () {
            debug.marker('...socket.io initialized.', 'lib/index', 70);

            // emit the realtimeReady event on the Server
            Server.emit('realtimeReady'); 
        });

        tools.realtime.on('err', function (err) {
            throw err;
        });
       
    };

    function listening () {
        debug.marker (util.format("\nAdminion Game Server listening --> %s", Server.env.url()), 'lib/index', 83);

        Server.emit('ready');

    };



    // when db is ready, initialize http
    Server.on('dbReady', httpInit);

    // when http is ready, initialize realtime
    Server.on('httpReady', realtimeInit);

    // when realtime is ready, the game is ready.  let's tell everyone!
    Server.on('realtimeReady', listening);

    // return our server instance
    return Server;
};
