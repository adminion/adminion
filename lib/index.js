
/**
 * Configure and export the main adminion module 
 */

// define the adminion module object 
var adminion = module.exports = {};

// express is the express module itself
var express = require('express');

// store the express app inside our adminion module
var app = adminion.app = express()
	, auth = adminion.auth = require('./auth')
	, config = adminion.config = require('../config/')
	, env = adminion.env = require('./env');
	
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


