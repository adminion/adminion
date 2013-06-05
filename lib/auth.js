/**
 *	lib/auth.js - used for the sole purpose of authenticating Players
 *
 *
 */

// define the module object
var auth = module.exports = {};

var passport = auth.passport = require('passport')
	, Player = require('../models/player')(mongoose);

passport.serializeUser(Player.serializeUser());
passport.deserializeUser(Player.deserializeUser());
	
// authentication middleware
auth.ensure = function (req, res, next) {
	console.info('%s - Authentication required', req.url);
	if (req.isAuthenticated()) {
		console.log('%s - %s already authenticated.', req.url, req.session.user.handle);
		return next();
	} else {
		console.log('NOT authenticated.  redirecting to logon...');
		res.redirect('/logon?redir=' + req.url);
	}
};

