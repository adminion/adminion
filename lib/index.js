/**
 *  lib/index.js
 *
 *  Adminion Server
 *
 */

// node core modules
var events =        require('events'),
    util =          require('util');

// 3rd party modules
var debug = require('debug')('adminion');

// adminion modules
var config =        require('./config'),
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
        debug('data layer ready!');
           
        transport = new Transport(data);

        transport.on('ready', function transportReady () {
            
            debug('transport layer ready!');
            self.emit('ready');
        });

        transport.start();
    });

    this.env = function () {
        return env;
    };

    this.kill = function () {

        debug('Server recevied KILL command--ending now!');
        
        process.kill();

        return true;
    };

    this.start = function () {
        debug('Starting Adminion Game Server...');

        
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

debug('AdminionServer', AdminionServer);

module.exports = AdminionServer;
