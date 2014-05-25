
var Adminion = require('./lib/'),
    config = require('./lib/config'),
    env = require('./lib/env'),
    prepl  = require('prepl'),
    util = require('util'),
    utils = require('./lib/utils'),
    interrupt,
    server;

global.debug = require('./lib/debug')(config.debug);

process.on('SIGINT', function () {
    if (interrupt) {
        server.stop(process.exit);
    } else {
        console.log('\n(^C again to quit)'); 
        interrupt = setTimeout(function () {
            interrupt = undefined;
        }, 1000);
    }
        
});

// debug.emit('val', 'config', config)
    
debug.emit('val', 'Adminion', Adminion);

server = new Adminion();

server.setMaxListeners(0);

// debug.emit('val', 'server', server);

server.on('error', server.kill);

server.on('ready', function ready () {

    debug.emit('msg', util.format('total memory usage: %d MB', process.memoryUsage().rss / utils.MB ));
    
    console.log('\nAdminion game server started: %s', env.url())
    
    return true;
});

server.on('stopped', function stopped () {
    process.exit();
});

server.start();
