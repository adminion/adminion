/**
 *  debug.js - smb wrapper for console.log & console.err 
 * 
 */
 
var config = require('./config'), 
    events = require('events'), 
    util = require('util');

module.exports = function () {

    var debug = Object.create(events.EventEmitter.prototype);

    var marker = '';

    for (var i = 0; i < process.stdout.columns; i +=1 ) {
        marker += '-';
    }

    function output (text, value) {
        if (!config.debug.compact) {
            console.log(marker);
        }

        console.log(text);

        if (value) {
            console.log(value);
        }

        if (config.debug.printStack) {
            console.trace();
        }    

        if (!config.debug.compact) {
            console.log(marker);
        }

    };

    function val (name, value) {
        
        var text = util.format("DEBUG: (%s) %s", typeof(value), name);

        output(text, value);

    };
    
    function msg (message) {
        var text = util.format('DEBUG: "%s"', message);
        output(text);
    };

    if (config.debug) {
        debug.on('val', val);
        debug.on('msg', msg);
        
    }

    return debug;
}

