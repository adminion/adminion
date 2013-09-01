<<<<<<< HEAD

// node core modules
var events = require('events')
	, util = require('util');

module.exports = function Auth (Adminion) {
	Adminion.auth = Object.create(events.EventEmitter.prototype);

	Adminion.auth.init = function () {
		Adminion.auth.passport = require('passport');

		// createStrategy() returns the pre-built strategy
		Adminion.auth.passport.use(Adminion.db.Accounts.createStrategy());
		// serializeUser() and deserializeUser() return the functions passport will use
		Adminion.auth.passport.serializeUser(Adminion.db.Accounts.serializeUser());
		Adminion.auth.passport.deserializeUser(Adminion.db.Accounts.deserializeUser());

		Adminion.auth.emit('ready');

	}

	// authentication middleware
	Adminion.auth.verify = function (request, response, next) {
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

=======
>>>>>>> temp_rewind
