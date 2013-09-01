
// node core modules
var events = require('events');

// adminion core modules
var Db = 			require('./db')
	, Http = 		require('./http')
	, Realtime = 	require('./realtime');

// export the Server factory function
module.exports = function () {

    // Adminion Server Instance
    var Server = Object.create(null);

    // make Server an EventEmitter without using the new operator
    Server = Object.create(events.EventEmitter.prototype);

    Server.config  = require('./config');
    Server.env     = require('./env');
    Server.util    = require('./util');


    Server.Start = function () {
        // emit the start event on the Server
        Server.emit('start');
    }

    // initialize the database
    function dbInit () {
        console.log('Initializing database...');

        // create a db module instance passing it Server
        Server.db = Db(Server);

        // when db module is ready
        Server.db.on('ready', function () {
            console.log('...database initialized.');

            // emit the dbReady event on the Server
            Server.emit('dbReady');
        });

    };

    // initialize the webserver
    function httpInit () {
        console.log('Initializing webserver...');

        // create a db module instance passing it Server
        Server.http = Http(Server);

        // when http module is ready
        Server.http.on('ready', function () {
            console.log('...webserver initialized.');

            // emit the httpReady event on the Server
            Server.emit('httpReady');
        });
    };

    // initialize the realtime system
    function realtimeInit () {
        console.log('Initializing realtime library...');

        // create a db module instance passing it Server
        Server.realtime = Realtime(Server);

        Server.realtime.on('ready', function () {
            console.log('...realtime library initialized.');

            // emit the realtimeReady event on the Server
            Server.emit('realtimeReady'); 
        });

        Server.realtime.on('err', function (err) {
            throw err;
        });
       
    };

    function listening () {
        var marker = '';

        for (var i = 0; i < process.stdout.columns; i +=1 ) {
            marker += '/';
        }

        console.log(marker);
        console.log("\nAdminion Game Server listening --> %s\n", Server.env.url());
        console.log(marker);

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
