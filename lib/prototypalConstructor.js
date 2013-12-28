/**
 * prototypalconstructor creates a function used to create
 * prototypal instances
 *
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
    var func, prototype = Object.create(extend && extend.prototype);

    if (methods) {
        
        methods.keys().forEach(function (key) {
            prototype[key] = methods[key];
        });
    }

    func = function () {
        var that = Object.create(prototype);

        if (typeof initializer === 'function') {
            initializer.apply(that, arguments);
        }
        return that;
    };

    func.prototype = prototype;

    prototype.constructor = func;

    return func;

};