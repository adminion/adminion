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

    this.config = config; 
    this.env = env;

    var modules = { 
        enabled: ['db', 'cache', 'http', 'realtime'], 
        ready: { 
            instances : {},
            count: 0
        }

    };

    var self = this;

    function loadModule () {

        var moduleConstructor,
            moduleID = modules.ready.count,
            moduleInstance,
            moduleName,
            modulePath,
            moduleTools = {
                config: self.config,
                env:    self.env,
                utils:  self.utils,
                modules: modules.ready.instances
            };

        if (modules.enabled.length === moduleID) {
            self.emit('ready');
            return true;
        }

        // get the module name from the list of modules who's id is the length of the ready modules array
        moduleName = modules.enabled[moduleID];
        modulePath = './' + moduleName;

        debug.emit('msg', 'loading module: ' + moduleName + '...');

        // get the module constructor 
        moduleConstructor = require(modulePath);

        // construct a new instance of the module
        moduleInstance = new moduleConstructor(moduleTools);

        // when the module is ready
        moduleInstance.on('ready', function () {
            // put it in the ready modules array
            modules.ready.instances[moduleName] = moduleInstance;
            modules.ready.count +=1;

            debug.emit('msg', '...loaded module: ' + moduleName + '!');
            // debug.emit('val', moduleName, moduleInstance);
            // debug.emit('val', 'modules.ready.count', modules.ready.count);
            // debug.emit('val', 'modules.ready.instances', modules.ready.instances);

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
