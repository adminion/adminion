
var util = require('util');

// @see - http://killdream.github.io/blog/2011/10/understanding-javascript-oop/index.html

// Aliases for the rather verbose methods on ES5
var descriptor  = Object.getOwnPropertyDescriptor
  , properties  = Object.getOwnPropertyNames
  , define_prop = Object.defineProperty

var MILLISECOND = 1,
    SECOND = 1000 * MILLISECOND,
    MINUTE = 60 * SECOND,
    HOUR = 60 * MINUTE,
    DAY = 24 * HOUR,
    WEEK = 7 * DAY,
    MONTH = 30 * DAY,
    YEAR = 365 * DAY;

// (target:Object, source:Object) → Object
// Copies properties from `source' to `target'
function extend(target, source) {
    properties(source).forEach(function(key) {
        define_prop(target, key, descriptor(source, key)) })

    return target;
};

/**
 *  prototypalConstructor(extend, initializer, methods) {...}
 *
 * extend:
 *  the object which the new constructor function will extend
 *
 * initializer:
 *  the function to initialize the new 
 *
 * methods:
 *  an object containing functions to be added to the r
 *
 */

function prototypalConstructor(extend, initializer, methods) {

    // declare init, declare prototype, then assign to it the result
    // of passing a valid extend object's prototype to Object.create
    var init, prototype = Object.create(extend && extend.prototype);

    if (methods) {
        
        Object.keys(methods).forEach(function (key) {
            prototype[key] = methods[key];
        });
    }

    init = function () {
        var that = Object.create(prototype);

        if (typeof initializer === 'function') {
            initializer.apply(that, arguments);
        }
        return that;
    };

    init.prototype = prototype;

    prototype.constructor = init;

    return init;

};

// (parent:Object) → Object
// Copies properties from `parent' to new `child'
function spawn (parent) {
    var child = {};
    properties(parent).forEach(function(key) {
        define_prop(child, key, descriptor(parent, key)) })

    return child;
};

function spawnExtend (target, source) {
    return extend(spawn(target), source);

};

module.exports = {

    format: util.format,
    extend: extend,
    prototypalConstructor: prototypalConstructor,
    spawn: spawn,
    spawnExtend: spawnExtend,

    gameID: function (socket) {
        // the two slashes create an empty index 
        //    0     1         2            3              4
        // https: /   / localhost:1337 / games / abcdefghi12345678990
        return socket.handshake.headers.referer.split('/')[4] || false;
    },

    accountID: function (socket) {
        return socket.handshake.user['_id'] || false;
    },
    
    MILLISECOND: MILLISECOND,
    SECOND: SECOND,
    MINUTE: MINUTE,
    HOUR: HOUR,
    DAY: DAY,
    WEEK: WEEK,
    MONTH: MONTH,
    YEAR: YEAR
};
