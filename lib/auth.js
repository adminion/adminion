
var auth = module.exports = {};

var LocalStrategy = require('passport-local').Strategy
	, passport = auth.passport = require('passport')
	, player = require('../models/player');
	
// define authentication strategy 
function strategy(email, password, success) {
	
	// fine one user who's email is 
	return player.findOne({ email: email, password: password }, 
		// once the database is finished loading 
		function (err, user) {
			if (err) { 
				// an error occurred while looking up the user
				return success(err); 
			}
		
			if (!user) { 
				// no user was found
				return success(null, false); 
			}
		
			// user was found and password matches
			return success(null, user);
		}
	);
};

// define authentication middleware
// this is foreign and needs to be rewritten for its current app
function verify(req, res, next) {
	console.info('%s - Authentication required', req.url);
	if (req.session.user) {
		console.log('%s - %s already authenticated.', req.url, req.session.user.username);
		next();
	} else {
		console.log('NOT authenticated.  redirecting to logon...');
		res.redirect('/logon?redir=' + req.url);
	}
};

auth.verify = verify;

// employ authentication strategy defined above
passport.use(new LocalStrategy({
	usernameField : 'email'
}, strategy));
