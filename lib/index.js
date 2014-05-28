/**
 *  lib/index.js
 *
 *  Adminion Server
 *
 */


var events =        require('events'),
    util =          require('util'),
    config =        require('./config'),
    env =           require('./env'),
    utils =         require('./utils'),
    Data =          require('./data'),
    Transport =     require('./transport'); 

function AdminionServer () {

    // makes it work with or without new ! how neat!
    if (!(this instanceof AdminionServer)) return new AdminionServer();

    var data,
        transport,
        self = this;

    data = new Data();

    data.on('ready', function dataReady () {
        // debug.emit('msg', 'data layer ready!');
           
        transport = new Transport(data);

        transport.on('ready', function transportReady () {
            
            // debug.emit('msg', 'transport layer ready!');
            self.emit('ready');
        });

        transport.start();
    });

    this.env = function () {
        return env;
    };

    this.kill = function () {

        // debug.emit('msg', 'Server recevied KILL command--ending now!');
        
        process.kill();

        return true;
    };

    this.start = function () {
        // debug.emit('msg', 'Starting Adminion Game Server...');

        
        this.emit('starting');

        data.start();

        this.on('ready', function () {
            self.emit('started');
        });

        return true;
    };

    this.stop = function (cb) {

        this.emit('stopping');

        transport.stop(cb);

        this.emit('stopped');
        
        return true;
    };

    this.update = function () {
        data.updateCache(function () {
            self.emit('update');
        });
    };
};

util.inherits(AdminionServer, events.EventEmitter);

// debug.emit('val', 'AdminionServer', AdminionServer);

module.exports = AdminionServer;
