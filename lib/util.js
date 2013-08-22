// @see - http://killdream.github.io/blog/2011/10/understanding-javascript-oop/index.html

// Aliases for the rather verbose methods on ES5
var descriptor  = Object.getOwnPropertyDescriptor
  , properties  = Object.getOwnPropertyNames
  , define_prop = Object.defineProperty

module.exports = {
	// (target:Object, source:Object) → Object
	// Copies properties from `source' to `target'
	extend: function (target, source) {
	    properties(source).forEach(function(key) {
	        define_prop(target, key, descriptor(source, key)) })

	    return target;
	},

	// (parent:Object) → Object
	// Copies properties from `parent' to new `child'
	spawn: function (parent) {
		var child = {};
		properties(parent).forEach(function(key) {
	        define_prop(child, key, descriptor(parent, key)) })

	    return child;
	},

	gameID: function (socket) {
		// the two slashes create an empty index 
		//    0     1         2	           3              4
		// https: /   / localhost:1337 / games / abcdefghi12345678990
		return socket.handshake.headers.referer.split('/')[4];
	},

	accountID: function (socket) {
		return socket.handshake.user['_id'];
	}

};