
// node core modules
var events = require('events')
    , util = require('util');

// adminion core modules
var Db = 			require('./db')
	, Http = 		require('./http')
	, Realtime = 	require('./realtime');

// export the Server factory function
module.exports = function AdminionServer () {

    // Adminion Server Instance
    var Server = Object.create(events.EventEmitter.prototype);

    Server.config  = require('./config');
    Server.env     = require('./env');
    Server.util    = require('./util'); 

    Server.Start = function () {
        // emit the start event on the Server
        Server.emit('start');
    }

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

    // when we are starting the game, the first step is to initialize the database
    Server.on('start', dbInit);

    // when db is ready, initialize http
    Server.on('dbReady', httpInit);

    // when http is ready, initialize realtime
    Server.on('httpReady', realtimeInit);

    // when realtime is ready, the game is ready.  let's tell everyone!
    Server.on('realtimeReady', listening);

    // return our server instance
    return Server;
};
