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

    var modules, moduleTools;

    modules = { 
        enabled: ['data', 'http', 'realtime'], 
        instances : {},
        ready: 0
    };

    moduleTools = {
        config: this.config,
        env:    this.env,
        utils:  this.utils,
    };

    var self = this;

    function loadModule () {

        var moduleConstructor,
            moduleInstance,
            moduleName = modules.enabled[modules.ready],
            modulePath = './' + moduleName;

        if (modules.enabled.length === modules.ready) {
            self.emit('ready');
            return true;
        }

        

        // debug.emit('msg', 'loading module: ' + moduleName + '...');

        // get the module constructor 
        moduleConstructor = require(modulePath);

        // construct a new instance of the module
        moduleInstance = new moduleConstructor(moduleTools);

        // when the module is ready
        moduleInstance.on('ready', function () {
            // put it in the ready modules array
            modules.instances[moduleName] = moduleInstance;
            modules.ready +=1;

            moduleTools[moduleName] = moduleInstance;

            debug.emit('msg', '...module loaded: ' + moduleName + '!');
            // debug.emit('val', moduleName, moduleInstance);
            // debug.emit('val', 'modules.ready', modules.ready);
            // debug.emit('val', 'modules.instances', modules.instances);

            // load the next module
            loadModule();
        });

        moduleInstance.start();

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
            this.emit('started');
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

server = new AdminionServer();

module.exports = server;
