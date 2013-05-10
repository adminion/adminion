
/**
 * Configure and export an express app object 
 */

var express = require('express')
	// passport for authentication / login sessions
	, passport = require('passport')
	, LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
	function(username, password, done) {
		User.findOne({ username: username }, function (err, user) {
			if (err) { return done(err); }
			if (!user) { return done(null, false); }
			if (!user.verifyPassword(password)) { return done(null, false); }
			return done(null, user);
		});
	}
));

// creates a new express app
var app = module.exports = express()
	// create new variable config, attach it to app.config and fill it with the config directory
	, config = app.config = require('../config/')
	, env = app.env = require('./env');

// authentication middleware
app.auth = function(req, res, next) {
	console.info('%s - Authentication required', req.url);
	if (req.session.user) {
		console.log('%s - %s already authenticated.', req.url, req.session.user.username);
		next();
	} else {
		console.log('NOT authenticated.  redirecting to logon...');
		res.redirect('/logon?redir=' + req.url);
	}
};

//wtf?  maybe i should dev mysql sessions? or perhaps cookies?
var MemStore = require('express/node_modules/connect/lib/middleware/session/memory');

//when NODE_ENV is undefined
app.configure(function() {
	app.set('port', config.express.port);
	app.set('views', config.express.views);
	app.set('view engine', 'jade');
	app.use(express.favicon(config.express.pub + '/favidcon-dark.ico'));
	app.use(express.logger('short'));	
	// for PUT requests
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	
	// sets up session store in memory also using cookies
	app.use(express.cookieParser());
	app.use(express.session({
		// this should probably be a hash of some kind in production.
		secret: 	"P4s$vv0R|)", 
		store: 		MemStore({
			// checks for stale sessions
			// i don't know what this number means or does..
			reapInterval: 60000 * 10
		})
	}));
	// serves static content
	app.use(express.static('static'));
	
	// error handler should be last resort
	app.use(function(err, req, res, next){
		res.status(404);
		res.render('errors/404', {request: req.body});
	});
});

//when NODE_ENV = 'development'
app.configure('dev',function () {
	app.use(express.errorHandler({
		dumpExceptions: true,
		showStack: true
	}));
});

//when NODE_ENV = 'production'
app.configure('prod',function () {
	app.use(express.logger('prod'));
});

app.set('views', config.express.views);
app.set('view engine', config.express.viewEngine);
