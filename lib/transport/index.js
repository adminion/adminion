
// node core modules
var events = require('events'), 
    util = require('util');

// adminion server modules
var Adminion_http = require('./http'),
    Adminion_realtime = require('./realtime'),
    config = require('../config'),
    env = require('../env');

function Adminion_transport (data) {

    var io,
        http,
        self = this;

    http = new Adminion_http(data);

    io = new Adminion_realtime(data, http);

    this.start = function () {

        http.start();
        http.on('ready', function () {
            self.emit('ready');
        });
    };

    this.stop = function () {
        http.server.close();
    }

};

util.inherits(Adminion_transport, events.EventEmitter);

module.exports = Adminion_transport;
