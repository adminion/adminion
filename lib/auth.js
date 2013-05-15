/**
 * configure and export the adminion authentication module
 */
 
var LocalStrategy = require('passport-local').Strategy
	, passport = require('passport')
	, players = require('./players');
	
// define module object
var auth = module.exports = {};

// define authentication strategy
auth.strategy = function(username, password, success) {
	Players.findOne({ username: username }, function (err, user) {
		if (err) { 
			// an error occurred while looking up the user
			return success(err); 
		}
		
		if (!user) { 
			// no user was found
			return success(null, false); 
		}
		
		if (!user.verifyPassword(password)) { 
			// a user was found but the provided password does not match
			return success(null, false); 
		}
		
		// user was found and password matches
		return success(null, user);
	});
};

// define authentication middleware

// this is foreign and needs to be rewritten for its current app
var verify = auth.verify = function(req, res, next) {
	console.info('%s - Authentication required', req.url);
	if (req.session.user) {
		console.log('%s - %s already authenticated.', req.url, req.session.user.username);
		next();
	} else {
		console.log('NOT authenticated.  redirecting to logon...');
		res.redirect('/logon?redir=' + req.url);
	}
};

// employ authentication strategy defined above
passport.use(new LocalStrategy(auth.strategy));

