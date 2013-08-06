/**
 *	lib/auth.js - used for the sole purpose of authenticating Players
 *
 *
 */

// node core modules
var util = require('util');

// local pointer to main Adminion instance
var Adminion;

function Auth() {
	var self = this;

	this.init = function(onReady) {
		this.passport = require('passport');

		// createStrategy() returns the pre-built strategy
		this.passport.use(Adminion.db.Person.createStrategy());
		// serializeUser() and deserializeUser() return the functions passport will use
		this.passport.serializeUser(Adminion.db.Person.serializeUser());
		this.passport.deserializeUser(Adminion.db.Person.deserializeUser());

		onReady(this);

	}

	// authentication middleware
	this.verify = function(request, response, next) {
		var redirectURL;

		console.log('%s - Authorizaton required...', request.url);
	//		debug.emit('var' , 'request.session', request.session, 'lib/auth.js', 332);
		// this is a pretty crude way of doing this but it works at this scale;
		// however, it would be a silly performance loss to do this every single time...
		if (request.isAuthenticated()) {
			console.log('\t--> %s is authorized', request.user.email);
			return next();
		} else {
			console.log('\t--> NOT authenticated.  redirecting to logon...');
			redirectURL = util.format('/Logon?redir=%s', request.url);
			request.cookies.err = 'You need to logon before you can visit ' + request.url;
			response.redirect(redirectURL);
		}
	};
};

module.exports = function(adminion, onReady) {

	Adminion = adminion;

	var instance = new Auth();

	instance.init(onReady);

};