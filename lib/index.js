/**
 *  lib/index.js
 *
 *  Adminion Server
 *
 */


var events =            require('events'),
    util =              require('util'),
    config =            require('./config'),
    env =               require('./env'),
    utils =             require('./utils');

var modules = { 
        enabled: ['data', 'http', 'realtime'], 
        instances : {},
        ready: 0
    };


function AdminionServer () {

    // makes it work with or without new ! how neat!
    if (!(this instanceof AdminionServer)) return new AdminionServer();

    var self = this;

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

        loadModule();

        this.on('ready', function () {
            self.emit('started');
        });

        return true;
    };

    this.stop = function () {

        this.emit('stopping');

        modules.instances.http.stop();

        this.emit('stopped');
        
        return true;
    };

    this.status = function () {
        return modules.instances.http.server;
    };

    function loadModule () {

        var constructor,
            instance,
            name = modules.enabled[modules.ready],
            path = './' + name;

        // debug.emit('msg', 'loading module: ' + name + '...');

        // get the module constructor 
        constructor = require(path);

        // construct a new instance of the module
        instance = new constructor(modules.instances);
        
        // when the module is ready
        instance.on('ready', function onModuleReady () {
            // put it in the ready modules array
            modules.instances[name] = instance;
            modules.ready +=1;

            debug.emit('msg', '...module loaded: ' + name + '!');
            // debug.emit('val', name, instance);
            // debug.emit('val', 'modules.ready', modules.ready);
            // debug.emit('val', 'modules.instances', modules.instances);

            if (modules.enabled.length === modules.ready) {
                self.emit('ready');
                return true;

            } else {
                // load the next module
                loadModule();
            }
            
        });

        instance.start();

        return true;
        
    };

};

util.inherits(AdminionServer, events.EventEmitter);

// debug.emit('val', 'AdminionServer', AdminionServer);

module.exports = AdminionServer;
