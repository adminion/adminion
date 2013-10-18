// node core modules
var events = require('events'), 
    util = require('util');

// adminion core modules
var Db =                         require('./db'),
    Http =                 require('./http'),
        Realtime =         require('./realtime');

// export the Server factory function
module.exports = function AdminionServer () {

    var Server = Object.create(events.EventEmitter.prototype);

    var config   = require('./config'),
        env      = require('./env'),
        util     = require('./util');

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
        value: function (accountID) {
            return !!this[accountID];
        }
    });

    // initialize the database
    function dbInit () {
        debug.marker('Initializing database...', 'lib/index', 31);

        // create a db module instance passing it Server
        Server.db = Db(Server);

        // when db module is ready
        Server.db.on('ready', function () {
            debug.marker('database initialized', 'lib/index', 38);

            // emit the dbReady event on the Server
            Server.emit('dbReady');
        });

    };

    // initialize the webserver
    function httpInit () {
        debug.marker('Initializing webserver...','lib/index', 48);

        // create a db module instance passing it Server
        Server.http = Http(Server);

        // when http module is ready
        Server.http.on('ready', function () {
            debug.marker('...webserver initialized.', 'lib/index', 55);

            // emit the httpReady event on the Server
            Server.emit('httpReady');
        });
    };

    // initialize the realtime system
    function realtimeInit () {
        debug.marker('Initializing realtime library...', 'lib/index', 64);

        // create a db module instance passing it Server
        Server.realtime = Realtime(Server);

        Server.realtime.on('ready', function () {
            debug.marker('...realtime library initialized.', 'lib/index', 70);

            // emit the realtimeReady event on the Server
            Server.emit('realtimeReady'); 
        });

        Server.realtime.on('err', function (err) {
            throw err;
        });
       
    };

    function listening () {
        debug.marker (util.format("\nAdminion Game Server listening --> %s", Server.env.url()), 'lib/index', 83);

        Server.emit('ready');

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


    Server.getAccount = function (accountID) {
        return Accounts[accountID] || false;
    };

    Server.getAccounts = function (offset, count) {
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

    Server.getGame = function (gameID) {
        return Games[gameID] || false;
    };

    Server.getGames = function (offset, count) {
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

    Server.logon = function (account) {

        Accounts[account['_id']] = account;

        debug.val('Accounts', Accounts, 'lib/index.js', 224);
    };

    Server.logoff = function (account) {
        delete Accounts[account['_id']];
        debug.val('Accounts', Accounts, 'lib/index.js', 229);
    };

    Server.addGame = function (game) { 
        Games[game['_id']] = game;

        debug.val('Games', Games, 'lib/index.js', 252);
    };

    Server.removeGame = function (gameID) {
        delete (Games[gameID]);
        debug.val('Games', Games, 'lib/index.js', 257);
    };

    Server.addAccount = function (accountID) {
        Sockets.initAccount(accountID);
    };
    
    Server.removeAccount = function (accountID) {
        
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
