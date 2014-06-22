/**
 *  debug.js - smb wrapper for console.log & console.err 
 * 
 */
 
var events = require('events'), 
    util = require('util'),
    utils = require('techjeffharris-utils');

module.exports = function (config) {

    var debug = Object.create(events.EventEmitter.prototype);

    if (config.stackTraceLimit) {
        Error.stackTraceLimit = config.stackTraceLimit;
    }

    function output (text, value) {
        var marker = '';

        for (var i = 0; i < process.stdout.columns; i +=1 ) {
            marker += '-';
        }

        if (config.marker) {
            console.log(marker);
        }

        console.log(text);

        // if a value was provided as an argument
        if ('1' in arguments) {
            // some types don't show up when logged to console, so we'll convert 
            // them to strings for better readability
            switch (utils.getType(value)) {
                case 'boolean':
                case 'number':
                    value = String(value);
                break;

                case 'object':
                    if (value === null) {
                        value = String(value);
                    }
                break;
                
            }

            console.log(value);
        }

        if (config.printStack) {
            console.trace();
        }    

        if (config.marker) {
            console.log(marker);
        }

    };

    function val (name, value) {
        
        var text = util.format("DEBUG: (%s) %s", utils.getType(value), name);

        output(text, value);

    };
    
    function msg (message) {
        var text = util.format('DEBUG: "%s"', message);
        output(text);
    };

    function needle () {
        msg('NEEDLE');
    }

    if (config) {
        debug.on('val', val);
        debug.on('msg', msg);
        debug.on('needle', needle);
        
    }

    return debug;
}

