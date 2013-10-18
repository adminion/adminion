
// node core modules
var events = require('events'), 
    util = require('util');

// adminion core modules
var Db = 			require('./db'),
    Http = 		require('./http'),
	Realtime = 	require('./realtime'),
    socketStore = require('../models/socket');

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

    // when db is ready, initialize http
    Server.on('dbReady', httpInit);

    // when http is ready, initialize realtime
    Server.on('httpReady', realtimeInit);

    // when realtime is ready, the game is ready.  let's tell everyone!
    Server.on('realtimeReady', listening);

    // return our server instance
    return Server;
};
