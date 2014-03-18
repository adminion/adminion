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
    utils =             require('./utils'),
    server;

function AdminionServer () {

    // makes it work with or without new ! how neat!
    if (!(this instanceof AdminionServer)) return new AdminionServer();

    this.config = config; 
    this.env = env;

    var modules, keyRing;

    modules = { 
        enabled: ['data', 'http', 'realtime'], 
        instances : {},
        ready: 0
    };

    // the keyRing provides access to each
    keyRing = {
        config: this.config,
        env:    this.env,
        utils:  this.utils,
    };

    var self = this;

    function loadModule () {

        var constructor,
            instance,
            name = modules.enabled[modules.ready],
            path = './' + name;

        // debug.emit('msg', 'loading module: ' + name + '...');

        // get the module constructor 
        constructor = require(path);

        // construct a new instance of the module
        instance = new constructor(keyRing);

        
        // when the module is ready
        instance.on('ready', function onModuleReady () {
            // put it in the ready modules array
            modules.instances[name] = instance;
            modules.ready +=1;

            // then add it to the keyRing
            keyRing[name] = instance;

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

    this.kill = function () {

        // debug.emit('msg', 'Server recevied KILL command--ending now!');
        
        process.exit();

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

        realtime.stop();

        this.emit('stopped');
        
        return true;
    };

    return true;

};

util.inherits(AdminionServer, events.EventEmitter);

// debug.emit('val', 'AdminionServer', AdminionServer);

module.exports = AdminionServer;
