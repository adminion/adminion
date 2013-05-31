/**
 *	lib/auth.js - used for the sole purpose of authenticating Players
 *
 *
 */

// define the module object
var auth = module.exports = {};

// setup prerequisites
var mongoose = require('mongoose')
	, passport = require('passport');

// define the connection string
var uristring = 'mongodb://localhost/adminion';
	
// Connect asynchronously.  Mongoose will queue up database
// operations and release them when the connection is complete.
mongoose.connect(uristring, function (err, res) {
  if (err) { 
    console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  } else {
    console.log ('Successfully connected to: ' + uristring);
  }
});

// employ authentication strategy defined above
passport.use(Player.createStrategy());
passport.serializeUser(Player.serializeUser());
passport.deserializeUser(Player.deserializeUser());
	
// define authentication middleware
// this is foreign and needs to be rewritten for its current app
auth.verify = function (req, res, next) {
	console.info('%s - Authentication required', req.url);
	if (req.session.user) {
		console.log('%s - %s already authenticated.', req.url, req.session.user.handle);
		next();
	} else {
		console.log('NOT authenticated.  redirecting to logon...');
		res.redirect('/logon?redir=' + req.url);
	}
};

