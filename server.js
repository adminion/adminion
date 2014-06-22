
var Adminion = require('./lib/'),
    cli,
    config = require('./lib/config'),

    Debug = require('debug'),
    debug = Debug('adminion'),


    env = require('./lib/env'),
    prepl  = require('prepl'),
    util = require('util'),
    utils = require('./lib/utils'),
    interrupt,
    server;

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
    
server = new Adminion();

server.setMaxListeners(0);

debug('server', server);

server.on('error', server.kill);

server.on('ready', function ready () {

    debug(util.format('total memory usage: %d MB', process.memoryUsage().rss / utils.MB ));
    
    console.log('\nAdminion game server started: %s', env.url())
    
    return true;
});

server.on('stopped', function stopped () {
    process.exit();
});

cli = new prepl({
    name: env.serverName,
    socket: env.serverName + '.sock'
});

debug('cli', cli);

cli.register({
    name: 'update',
    help: 'Update the server\'s cached memory',
    action: function (socket) {
        server.update(function () {
            socket.write('cache updated')
        })
    }
})

cli.on('ready', function() {
    debug('cli ready')
    server.start();
});

cli.on('starting', function () {
    debug('cli starting');
})

cli.start();
