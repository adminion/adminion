/**
 *  debug.js - smb wrapper for console.log & console.err 
 * 
 */
 
var config = require('./config'), 
    events = require('events'), 
    util = require('util');

module.exports = function () {

    var debug = Object.create(events.EventEmitter.prototype);
    
    function val (name, value, file, line) {
        console.log("\nDEBUG: %s %s - %s", file, line, name);
        console.log(value);
        console.log();
    };
    
    function msg (message, file, line) {
        console.log('\nDEBUG: %s %s: %s\n', file, line, message);
    };

    function marker (label, file, line) {
        var marker = '';

        for (var i = 0; i < process.stdout.columns; i +=1 ) {
            marker += '-';
        }

        console.log(marker);
        msg(label, file, line);
        console.log(marker);

    };

    if (config.debug) {
        debug.on('val', val);
        debug.on('msg', msg);
        debug.on('marker', marker);
    }

    return debug;
}

